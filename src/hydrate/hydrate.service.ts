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
  TaxiiCollectionDocument,
  TaxiiCollectionEntity,
} from './schema';

/**
 * Service responsible for synchronizing TAXII collections and objects with ATT&CK Workbench.
 *
 * This service maintains exact synchronization with Workbench by:
 * 1. Always preferring the Workbench state, regardless of version
 * 2. Maintaining history through active/inactive states
 * 3. Reactivating previously seen versions when possible
 * 4. Creating new resources for unseen versions
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
        { '_meta.collectionRef.id': 1, '_meta.active': 1 },
        { background: true, name: 'taxii_objects_by_collection' },
      );

      await this.ensureIndex(
        this.stixObjectModel.collection,
        { '_meta.collectionRef.id': 1, 'stix.id': 1, '_meta.active': 1 },
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
    workbenchCollection: WorkbenchCollectionDto,
  ): TaxiiCollectionEntity {
    const taxiiDto = new TaxiiCollectionDto(workbenchCollection);
    return new this.collectionModel({
      id: taxiiDto.id,
      title: taxiiDto.title,
      description: taxiiDto.description,
      alias: taxiiDto.alias,
      canRead: taxiiDto.canRead,
      canWrite: taxiiDto.canWrite,
      mediaTypes: taxiiDto.mediaTypes,
      _meta: {
        workbenchCollection: {
          version: workbenchCollection.stix.x_mitre_version,
          modified: this.safeDate(workbenchCollection.stix.modified),
        },
        createdAt: new Date(),
        active: true,
      },
    });
  }

  private createCollectionRef(workbenchCollection: WorkbenchCollectionDto) {
    return {
      id: workbenchCollection.stix.id,
      title: workbenchCollection.stix.name,
      version: workbenchCollection.stix.x_mitre_version,
      modified: this.safeDate(workbenchCollection.stix.modified),
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
        active: true,
      },
    };
  }

  /**
   * Handles collection synchronization with Workbench, always preferring the Workbench state.
   *
   * Key behaviors:
   * 1. If no active TAXII collection exists with the same title -> create new
   * 2. If active TAXII collection exists:
   *    a. If versions match -> no action needed
   *    b. If versions differ:
   *       - Check if we've seen this version before
   *       - If yes -> reactivate that version
   *       - If no -> create new version
   */
  private async handleCollectionSync(
    workbenchCollection: WorkbenchCollectionDto,
  ): Promise<{ shouldCreateObjects: boolean }> {
    const workbenchVersion = workbenchCollection.stix.x_mitre_version;

    // Find current active collection
    const activeCollection = await this.collectionModel
      .findOne({
        title: workbenchCollection.stix.name,
        '_meta.active': true,
      })
      .exec();

    // Find any existing inactive collection matching the Workbench version
    const matchingVersion = await this.collectionModel
      .findOne({
        title: workbenchCollection.stix.name,
        '_meta.workbenchCollection.version': workbenchVersion,
        '_meta.active': false,
      })
      .exec();

    // No active collection exists - create new
    if (!activeCollection) {
      this.logger.debug(`Creating new TAXII collection for ${workbenchCollection.stix.name}`);
      const newCollection = this.createTaxiiCollectionEntity(workbenchCollection);
      await this.collectionModel.create(newCollection);
      return { shouldCreateObjects: true };
    }

    // Active collection exists but versions match - no action needed
    if (activeCollection._meta.workbenchCollection.version === workbenchVersion) {
      this.logger.debug(
        `Collection ${workbenchCollection.stix.name} versions match - no action needed`,
      );
      return { shouldCreateObjects: false };
    }

    // Deactivate current collection and its objects
    await this.collectionModel.findByIdAndUpdate(activeCollection._id, {
      $set: { '_meta.active': false },
    });

    await this.stixObjectModel.updateMany(
      {
        '_meta.collectionRef.id': activeCollection.id,
        '_meta.active': true,
      },
      { $set: { '_meta.active': false } },
    );

    // If we've seen this version before, reactivate it and its objects
    if (matchingVersion) {
      this.logger.debug(
        `Reactivating existing version ${workbenchVersion} for ${workbenchCollection.stix.name}`,
      );
      await this.collectionModel.findByIdAndUpdate(matchingVersion._id, {
        $set: { '_meta.active': true },
      });

      await this.stixObjectModel.updateMany(
        {
          '_meta.collectionRef.id': matchingVersion.id,
          '_meta.collectionRef.version': workbenchVersion,
          '_meta.active': false,
        },
        { $set: { '_meta.active': true } },
      );

      return { shouldCreateObjects: false };
    }

    // Create new collection for unseen version
    this.logger.debug(
      `Creating new collection for version ${workbenchVersion} of ${workbenchCollection.stix.name}`,
    );
    const newCollection = this.createTaxiiCollectionEntity(workbenchCollection);
    await this.collectionModel.create(newCollection);
    return { shouldCreateObjects: true };
  }

  private async handleOrphanedCollections(
    workbenchCollections: WorkbenchCollectionDto[],
  ): Promise<void> {
    const workbenchTitles = new Set(workbenchCollections.map((collection) => collection.stix.name));

    const orphanedCollections = await this.collectionModel
      .find({
        title: { $nin: Array.from(workbenchTitles) },
        '_meta.active': true,
      })
      .exec();

    if (orphanedCollections.length === 0) {
      this.logger.debug('No orphaned collections found');
      return;
    }

    // Mark collections as inactive
    await this.collectionModel.updateMany(
      { _id: { $in: orphanedCollections.map((c) => c._id) } },
      { $set: { '_meta.active': false } },
    );

    // Mark their objects as inactive
    await this.stixObjectModel.updateMany(
      {
        '_meta.collectionRef.id': { $in: orphanedCollections.map((c) => c.id) },
      },
      { $set: { '_meta.active': false } },
    );

    this.logger.debug(`Marked ${orphanedCollections.length} orphaned collections as inactive`);
  }

  private async syncCollectionObjects(workbenchCollection: WorkbenchCollectionDto): Promise<void> {
    const bundle = await this.stixRepo.getCollectionBundle(
      workbenchCollection.stix.id,
      workbenchCollection.stix.modified,
    );

    if (!bundle.objects || bundle.objects.length === 0) {
      this.logger.debug(`No objects found in collection ${workbenchCollection.stix.id}`);
      return;
    }

    const collectionRef = this.createCollectionRef(workbenchCollection);
    const bulkOps = bundle.objects.map((stixObject) => ({
      insertOne: {
        document: this.createStixObjectEntity(stixObject, collectionRef),
      },
    }));

    // Execute bulk operations in batches of 1000
    for (let i = 0; i < bulkOps.length; i += 1000) {
      const batch = bulkOps.slice(i, i + 1000);
      await this.stixObjectModel.bulkWrite(batch);
    }

    this.logger.debug(
      `Synchronized ${bundle.objects.length} objects for collection ${workbenchCollection.stix.id}`,
    );
  }

  @Cron(CronExpression.EVERY_30_MINUTES, {
    name: GET_TAXII_RESOURCES_JOB_TOKEN,
  })
  async findAndStoreTaxiiResources(): Promise<void> {
    this.logger.debug('Starting database collection and object hydration');

    try {
      const workbenchCollections = await this.stixRepo.getCollections();
      this.logger.debug(
        `Successfully retrieved ${workbenchCollections.length} collections from Workbench`,
      );

      await this.handleOrphanedCollections(workbenchCollections);

      for (const workbenchCollection of workbenchCollections) {
        try {
          const { shouldCreateObjects } = await this.handleCollectionSync(workbenchCollection);

          if (shouldCreateObjects) {
            await this.syncCollectionObjects(workbenchCollection);
          }

          this.logger.debug(`Processed collection '${workbenchCollection.stix.id}'`);
        } catch (e) {
          this.logger.error(`Failed to process collection ${workbenchCollection.stix.id}`, e.stack);
        }
      }
    } catch (e) {
      this.logger.error('Failed to retrieve collections from Workbench', e.stack);
      throw e;
    }
  }

  async hydrate(): Promise<void> {
    this.logger.debug('Manual hydration process triggered');
    await this.findAndStoreTaxiiResources();
  }
}
