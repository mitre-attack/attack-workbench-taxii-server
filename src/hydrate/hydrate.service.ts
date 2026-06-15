import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LoggerService } from '@nestjs/common/services/logger.service';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { STIX_REPO_TOKEN } from 'src/stix/constants';
import { WorkbenchCollectionDto } from 'src/stix/dto/workbench-collection.dto';
import { StixRepositoryInterface } from 'src/stix/providers/stix.repository.interface';
import { TaxiiCollectionDto } from 'src/taxii/providers/collection/dto';
import { GET_TAXII_RESOURCES_JOB_TOKEN, HYDRATE_OPTIONS_TOKEN } from './constants';
import { HydrateConnectOptions } from './interfaces/hydrate-connect.options';
import {
  AttackObjectDocument,
  AttackObjectEntity,
  ReleasePointerDocument,
  ReleasePointerEntity,
  TaxiiCollectionDocument,
  TaxiiCollectionEntity,
} from './schema';

/**
 * Service responsible for synchronizing TAXII collections and objects with the configured STIX
 * data source (ATT&CK Workbench or the official ATT&CK releases on GitHub).
 *
 * Hydration is additive and source-agnostic:
 * 1. Every (collection, release) pair advertised by the source is hydrated exactly once. A pair
 *    already present in the database is skipped, so immutable releases are never re-downloaded.
 * 2. The collection document is written only after all of the release's objects, so its presence
 *    acts as a per-release commit marker; a crash mid-release is retried (idempotently) on the
 *    next sync.
 * 3. A latest-release pointer per collection is flipped only after hydration completes, giving
 *    clients of the default API root an atomic cutover to new releases.
 * 4. Pairs that disappear from the source are hard-deleted (a no-op for the GitHub source, whose
 *    releases are immutable and never delisted).
 */
@Injectable()
export class HydrateService implements OnModuleInit {
  private readonly logger: LoggerService = new Logger(HydrateService.name);

  constructor(
    @Inject(STIX_REPO_TOKEN) private stixRepo: StixRepositoryInterface,
    @InjectModel(TaxiiCollectionEntity.name)
    private collectionModel: Model<TaxiiCollectionDocument>,
    @InjectModel(AttackObjectEntity.name)
    private stixObjectModel: Model<AttackObjectDocument>,
    @InjectModel(ReleasePointerEntity.name)
    private releasePointerModel: Model<ReleasePointerDocument>,
    @Inject(HYDRATE_OPTIONS_TOKEN) private options: HydrateConnectOptions,
  ) {}

  async onModuleInit() {
    try {
      // Ensure indexes first
      await this.ensureIndex(
        this.stixObjectModel.collection,
        { '_meta.createdAt': 1 },
        { background: true, name: 'taxii_object_sorting' },
      );

      await this.ensureIndex(
        this.stixObjectModel.collection,
        {
          '_meta.collectionRef.id': 1,
          '_meta.collectionRef.version': 1,
          '_meta.createdAt': 1,
        },
        { background: true, name: 'taxii_objects_by_collection' },
      );

      await this.ensureIndex(
        this.stixObjectModel.collection,
        {
          '_meta.collectionRef.id': 1,
          '_meta.collectionRef.version': 1,
          'stix.id': 1,
          'stix.modified': -1,
          'stix.created': -1,
          '_meta.createdAt': -1,
        },
        { background: true, name: 'taxii_latest_objects_by_collection' },
      );

      await this.ensureIndex(
        this.stixObjectModel.collection,
        {
          '_meta.collectionRef.id': 1,
          '_meta.collectionRef.version': 1,
          'stix.id': 1,
        },
        { background: true, name: 'taxii_object_lookup' },
      );

      this.logger.debug('Successfully ensured all required indexes');

      // Try hydration only after indexes are created
      if (this.options.hydrateOnBoot) {
        try {
          this.logger.debug('Hydration on boot enabled - starting initial hydration');
          await this.hydrate();
        } catch (hydrateError) {
          // Log but don't throw hydration errors during startup
          this.logger.error(
            'Initial hydration failed - will retry during next scheduled run',
            hydrateError.stack,
          );
        }
      }
    } catch (error) {
      // Only throw if we couldn't create indexes
      this.logger.error('Failed to ensure indexes - cannot continue', error.stack);
      throw error;
    }
  }

  private async ensureIndex(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    collection: any,
    indexSpec: object,
    options: object = {},
  ): Promise<void> {
    try {
      await collection.createIndex(indexSpec, options);
    } catch (error) {
      if (error.code === 85 || error.code === 86) return;
      throw error;
    }
  }

  private safeDate(date: string | Date | undefined): Date {
    if (!date) return new Date();
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  private createTaxiiCollectionEntity(
    sourceCollection: WorkbenchCollectionDto,
  ): TaxiiCollectionEntity {
    const taxiiDto = new TaxiiCollectionDto(sourceCollection);
    return new this.collectionModel({
      id: taxiiDto.id,
      title: taxiiDto.title,
      description: taxiiDto.description,
      alias: taxiiDto.alias,
      canRead: taxiiDto.canRead,
      canWrite: taxiiDto.canWrite,
      mediaTypes: taxiiDto.mediaTypes,
      _meta: {
        release: {
          version: sourceCollection.stix.x_mitre_version,
          modified: this.safeDate(sourceCollection.stix.modified),
        },
        createdAt: new Date(),
      },
    });
  }

  private createCollectionRef(sourceCollection: WorkbenchCollectionDto) {
    return {
      id: sourceCollection.stix.id,
      title: sourceCollection.stix.name,
      version: sourceCollection.stix.x_mitre_version,
      modified: this.safeDate(sourceCollection.stix.modified),
    };
  }

  private createStixObjectEntity(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stixObject: any,
    collectionRef: ReturnType<typeof this.createCollectionRef>,
  ): AttackObjectEntity {
    return {
      stix: stixObject,
      _meta: {
        collectionRef,
        stixSpecVersion: '2.1',
        createdAt: new Date(),
      },
    };
  }

  /**
   * Hydrates a single (collection, release) pair unless it is already present in the database.
   *
   * Releases are treated as immutable: a pair is downloaded and written exactly once. The
   * collection document is created only after all of the release's objects have been inserted, so
   * its presence marks the release as fully hydrated. If a previous attempt crashed mid-release,
   * the missing commit marker causes a retry here, and the pre-insert cleanup makes that retry
   * idempotent.
   *
   * @returns true if the release was hydrated, false if it was already present
   */
  private async hydrateRelease(sourceCollection: WorkbenchCollectionDto): Promise<boolean> {
    const collectionId = sourceCollection.stix.id;
    const version = sourceCollection.stix.x_mitre_version;

    const exists = await this.collectionModel
      .exists({ id: collectionId, '_meta.release.version': version })
      .exec();
    if (exists) {
      return false;
    }

    this.logger.debug(`Hydrating release ${version} of collection ${collectionId}`);

    // Remove any objects left behind by a previously interrupted hydration of this release
    await this.stixObjectModel.deleteMany({
      '_meta.collectionRef.id': collectionId,
      '_meta.collectionRef.version': version,
    });

    const bundle = await this.stixRepo.getCollectionBundle(
      collectionId,
      sourceCollection.stix.modified,
    );

    const collectionRef = this.createCollectionRef(sourceCollection);
    const objects = bundle.objects ?? [];

    // Insert objects in batches of 1000
    for (let i = 0; i < objects.length; i += 1000) {
      const batch = objects.slice(i, i + 1000).map((stixObject) => ({
        insertOne: { document: this.createStixObjectEntity(stixObject, collectionRef) },
      }));
      await this.stixObjectModel.bulkWrite(batch);
    }

    // Commit marker: written last so a partially hydrated release is never considered complete
    await this.collectionModel.create(this.createTaxiiCollectionEntity(sourceCollection));

    this.logger.debug(
      `Hydrated ${objects.length} objects for release ${version} of collection ${collectionId}`,
    );
    return true;
  }

  /**
   * Points each collection's latest-release pointer at the newest *fully hydrated* release.
   * Pointers are computed from database state (not the source listing) so that a release that
   * failed to hydrate never becomes the default-root target. Selection is by release modified
   * timestamp because version strings do not sort lexicographically ("9.0" > "19.1").
   */
  private async updateLatestReleasePointers(): Promise<void> {
    const latestReleases: Array<{ _id: string; version: string; modified: Date }> =
      await this.collectionModel.aggregate([
        { $sort: { id: 1, '_meta.release.modified': -1 } },
        {
          $group: {
            _id: '$id',
            version: { $first: '$_meta.release.version' },
            modified: { $first: '$_meta.release.modified' },
          },
        },
      ]);

    for (const latest of latestReleases) {
      await this.releasePointerModel.updateOne(
        { collectionId: latest._id },
        {
          $set: {
            version: latest.version,
            modified: latest.modified,
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
    }

    this.logger.debug(`Updated ${latestReleases.length} latest-release pointers`);
  }

  /**
   * Hard-deletes (collection, release) pairs that are no longer advertised by the STIX data
   * source. This is a no-op for the GitHub source (the collection index never delists releases);
   * for Workbench it covers collections or collection versions deleted by their curators.
   */
  private async removeOrphanedReleases(sourceCollections: WorkbenchCollectionDto[]): Promise<void> {
    const sourcePairs = new Set(
      sourceCollections.map((elem) => `${elem.stix.id}::${elem.stix.x_mitre_version}`),
    );
    const sourceIds = new Set(sourceCollections.map((elem) => elem.stix.id));

    const hydratedPairs = await this.collectionModel
      .find({}, { id: 1, '_meta.release.version': 1 })
      .exec();

    let removed = 0;
    for (const pair of hydratedPairs) {
      const version = pair._meta.release.version;
      if (sourcePairs.has(`${pair.id}::${version}`)) {
        continue;
      }

      this.logger.debug(`Removing orphaned release ${version} of collection ${pair.id}`);
      await this.stixObjectModel.deleteMany({
        '_meta.collectionRef.id': pair.id,
        '_meta.collectionRef.version': version,
      });
      await this.collectionModel.deleteOne({ _id: pair._id });
      removed += 1;
    }

    // Drop pointers for collections that disappeared from the source entirely
    await this.releasePointerModel.deleteMany({ collectionId: { $nin: Array.from(sourceIds) } });

    if (removed > 0) {
      this.logger.debug(`Removed ${removed} orphaned releases`);
    } else {
      this.logger.debug('No orphaned releases found');
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES, {
    name: GET_TAXII_RESOURCES_JOB_TOKEN,
  })
  async findAndStoreTaxiiResources(): Promise<void> {
    this.logger.debug('Starting database collection and object hydration');

    let sourceCollections: WorkbenchCollectionDto[];
    try {
      sourceCollections = await this.stixRepo.getCollections(undefined, 'all');
      this.logger.debug(
        `Successfully retrieved ${sourceCollections.length} (collection, release) pairs from the STIX data source`,
      );
    } catch (e) {
      this.logger.error('Failed to retrieve collections from the STIX data source', e.stack);
      throw e;
    }

    for (const sourceCollection of sourceCollections) {
      try {
        await this.hydrateRelease(sourceCollection);
      } catch (e) {
        this.logger.error(
          `Failed to hydrate release ${sourceCollection.stix.x_mitre_version} of collection ${sourceCollection.stix.id}`,
          e.stack,
        );
      }
    }

    await this.updateLatestReleasePointers();
    await this.removeOrphanedReleases(sourceCollections);
  }

  async hydrate(): Promise<void> {
    this.logger.debug('Manual hydration process triggered');
    await this.findAndStoreTaxiiResources();
  }
}
