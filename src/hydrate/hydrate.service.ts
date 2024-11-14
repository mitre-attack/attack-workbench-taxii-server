import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectModel } from "@nestjs/mongoose";
import { Logger } from "@nestjs/common";
import { LoggerService } from "@nestjs/common/services/logger.service";
import { Model } from "mongoose";
import { TaxiiCollectionEntity, TaxiiCollectionDocument, AttackObjectEntity, AttackObjectDocument } from "./schema";
import { TaxiiCollectionDto } from "src/taxii/providers/collection/dto";
import { WorkbenchCollectionDto } from "src/stix/dto/workbench-collection.dto";
import { STIX_REPO_TOKEN } from "src/stix/constants";
import { StixRepositoryInterface } from "src/stix/providers/stix.repository.interface";
import { GET_TAXII_RESOURCES_JOB_TOKEN, HYDRATE_OPTIONS_TOKEN } from "./constants";
import { HydrateConnectOptions } from "./interfaces/hydrate-connect.options";

/**
 * Service responsible for synchronizing TAXII collections and objects with ATT&CK Workbench.
 * 
 * This service handles two main responsibilities:
 * 1. Collection Management: Synchronizing TAXII collections with Workbench collections
 * 2. Object Management: Maintaining STIX objects associated with each collection
 * 
 * Key Features:
 * - Collision Detection: Handles cases where a Workbench collection shares a title with an existing TAXII collection
 * - Drift Management: Removes orphaned TAXII collections (and their objects) when corresponding Workbench collections are deleted
 * - TAXII-Compliant Sorting: Ensures objects are retrievable in ascending order by addition date per TAXII 2.1 spec
 * 
 * @remarks
 * The service maintains a close relationship between TAXII collections and Workbench collections.
 * A TAXII collection in this implementation *is* a Workbench collection - they have a 1:1 relationship.
 * If no collections have been published in Workbench, the TAXII server will have no collections.
 */
@Injectable()
export class HydrateService implements OnModuleInit {

  private readonly logger: LoggerService = new Logger(HydrateService.name);

  constructor(
    @Inject(STIX_REPO_TOKEN) private stixRepo: StixRepositoryInterface,
    @InjectModel(TaxiiCollectionEntity.name) private collectionModel: Model<TaxiiCollectionDocument>,
    @InjectModel(AttackObjectEntity.name) private stixObjectModel: Model<AttackObjectDocument>,
    @Inject(HYDRATE_OPTIONS_TOKEN) private options: HydrateConnectOptions
  ) {}

  /**
   * Initializes the service when the module starts and ensures required database indexes exist for TAXII-compliant operation.
   *  - Ensures required database indexes exist
   *  - Triggers initial hydration if configured
   * 
   * Per TAXII 2.1 specification section 3.4:
   * "For Object and Manifest Endpoints, objects returned MUST be sorted in ascending 
   * order by the date it was added. Meaning, the most recently added object is last in the list."
   * 
   * We implement this requirement by:
   * 1. Tracking addition date in _meta.createdAt
   * 2. Creating an ascending index on this field
   * 3. Using this index in all object retrieval queries
   * 
   * @remarks
   * The index is created with { background: true } to avoid blocking database operations
   * during index creation. This is important for production deployments where the
   * collection may already contain data.
   */
  async onModuleInit() {
    // Create ascending index on _meta.createdAt for TAXII-compliant sorting
    await this.stixObjectModel.collection.createIndex(
      { '_meta.createdAt': 1 },
      {
        background: true,
        name: 'taxii_added_date_asc',
      }
    );

    this.logger.debug('Ensured TAXII-compliant sorting index exists');

    // Perform initial hydration if configured
    if (this.options.hydrateOnBoot) {
      this.logger.debug('Hydration on boot enabled - starting initial hydration');
      await this.hydrate();
    }
  }

  /**
   * Safely converts a string or Date to a Date object.
   * Returns current date if input is invalid.
   */
  private safeDate(date: string | Date | undefined): Date {
    if (!date) {
      return new Date();
    }

    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  /**
   * Creates a new TAXII collection entity from a Workbench collection.
   * 
   * @param workbenchCollection - The source Workbench collection
   * @returns A new TAXII collection entity with metadata linking it to its Workbench origin
   */
  private createTaxiiCollectionEntity(workbenchCollection: WorkbenchCollectionDto): TaxiiCollectionEntity {
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
          modified: this.safeDate(workbenchCollection.stix.modified)
        },
        createdAt: new Date()
      }
    });
  }

  /**
   * Creates a new STIX object entity with proper metadata for TAXII compliance.
   * 
   * @param stixObject - The raw STIX object from Workbench
   * @param collectionId - ID of the collection this object belongs to
   * @returns A new STIX object entity with required metadata
   * 
   * @remarks
   * The _meta.createdAt field is crucial as it's used to implement TAXII's
   * requirement for sorting objects by addition date.
   */
  private createObjectEntity(stixObject: any, collectionId: string): AttackObjectEntity {
    return {
      stix: stixObject,
      _meta: {
        workbenchCollection: {
          id: collectionId,
          title: stixObject.name,
          version: stixObject.x_mitre_version,
          modified: this.safeDate(stixObject.modified)
        },
        // All objects retrieved from 'Get Collection Bundles' are represented in STIX 2.1
        stixSpecVersion: '2.1',
        // This timestamp is used for TAXII-compliant sorting
        createdAt: new Date()
      }
    };
  }

  /**
   * Determines if a Workbench collection is newer than an existing TAXII collection.
   * 
   * The comparison is done in two stages:
   * 1. Compare versions (e.g., "1.0" vs "2.0")
   * 2. If versions are equal, compare modification dates
   * 
   * @param workbenchCollection - Collection from Workbench
   * @param existingCollection - Existing TAXII collection
   * @returns true if the Workbench collection is newer
   */
  private isNewer(workbenchCollection: WorkbenchCollectionDto, existingCollection: TaxiiCollectionDocument): boolean {
    const workbenchVersion = workbenchCollection.stix.x_mitre_version;
    const existingVersion = existingCollection._meta.workbenchCollection.version;

    this.logger.debug(
      `Comparing versions - Workbench: ${workbenchVersion} (${typeof workbenchVersion}), ` +
      `Existing: ${existingVersion} (${typeof existingVersion})`
    );

    // If versions are different, compare them numerically
    if (workbenchVersion !== existingVersion) {
      // TODO refactor to compare based on MAJOR > MINOR > PATCH (not integer based comparison)
      const comparison = parseFloat(workbenchVersion) > parseFloat(existingVersion);
      this.logger.debug(
        `Versions differ - comparison result: ${comparison} ` +
        `(${parseFloat(workbenchVersion)} > ${parseFloat(existingVersion)})`
      );
      return comparison;
    }

    // If versions are the same, compare modified dates
    const workbenchModified = this.safeDate(workbenchCollection.stix.modified);
    const existingModified = existingCollection._meta.workbenchCollection.modified;

    this.logger.debug(
      `Versions match, comparing dates - Workbench: ${workbenchModified}, ` +
      `Existing: ${existingModified}`
    );

    return workbenchModified > existingModified;
  }

  /**
   * Handles potential collisions between Workbench and TAXII collections.
   * 
   * A collision occurs when a Workbench collection has the same title as an
   * existing TAXII collection. In such cases, we keep the newer version based
   * on version number and modification date.
   * 
   * @param workbenchCollection - The collection from Workbench to process
   * @returns true if the collection was created/updated, false if no action was needed
   */
  private async handleCollisionAndSync(
    workbenchCollection: WorkbenchCollectionDto
  ): Promise<boolean> {

    this.logger.debug('Handling collision and synchronization of TAXII collections...');

    // Find existing collection with same title
    const existingCollection = await this.collectionModel.findOne({
      title: workbenchCollection.stix.name
    }).exec();

    if (!existingCollection) {
      // No collision - create new collection
      this.logger.debug('No collision detected - creating new TAXII collection');
      const taxiiEntity = this.createTaxiiCollectionEntity(workbenchCollection);
      await this.collectionModel.create(taxiiEntity);
      return true;
    }

    // If collection exists, check if workbench version is newer
    if (this.isNewer(workbenchCollection, existingCollection)) {
      this.logger.debug('Collision detected - prefer Workbench collection');
      const taxiiEntity = this.createTaxiiCollectionEntity(workbenchCollection);
      await this.collectionModel.findOneAndUpdate(
        { id: existingCollection.id },
        taxiiEntity,
        { new: true }
      );
      return true;
    }
    this.logger.debug('Collision detected - prefer existing collection');

    return false;
  }

  /**
   * Handles orphaned TAXII collections.
   * 
   * An orphaned collection is a TAXII collection whose corresponding Workbench
   * collection has been deleted. This can happen when:
   * 1. A collection is unpublished in Workbench
   * 2. A collection is deleted from Workbench
   * 
   * This method removes both the orphaned collections and their associated objects
   * to maintain consistency between Workbench and the TAXII server.
   * 
   * @param workbenchCollections - Current list of collections from Workbench
   */
  private async handleOrphanedCollections(
    workbenchCollections: WorkbenchCollectionDto[]
  ): Promise<void> {
    try {
      // Get all collection titles from Workbench
      const workbenchTitles = new Set(
        workbenchCollections.map(collection => collection.stix.name)
      );

      // Find collections that exist in TAXII but not in Workbench
      const orphanedCollections = await this.collectionModel
        .find({ title: { $nin: Array.from(workbenchTitles) } })
        .exec();

      if (orphanedCollections.length === 0) {
        this.logger.debug('No orphaned collections found');
        return;
      }

      // Get IDs of orphaned collections
      const orphanedIds = orphanedCollections.map(collection => collection.id);

      // Delete orphaned objects first
      await this.stixObjectModel.deleteMany({
        '_meta.workbenchCollection.id': { $in: orphanedIds }
      }).exec();

      // Then delete the orphaned collections
      await this.collectionModel.deleteMany({
        id: { $in: orphanedIds }
      }).exec();

      this.logger.debug(
        `Deleted ${orphanedCollections.length} orphaned collections and their associated objects`
      );

      // Log detailed information about deleted collections
      orphanedCollections.forEach(collection => {
        this.logger.debug(
          `Deleted orphaned collection: ${collection.id} (${collection.title}), ` +
          `version: ${collection._meta.workbenchCollection.version}`
        );
      });

    } catch (e) {
      this.logger.error('Failed to handle orphaned collections', e.stack);
      throw e;
    }
  }

  /**
   * Synchronizes STIX objects for a given collection.
   * 
   * @param collectionId - ID of the collection whose objects need syncing
   * @param replace - If true, all existing objects for this collection are replaced
   * 
   * @remarks
   * This method implements bulk operations for efficiency, processing objects in
   * batches of 1000. Each object's _meta.createdAt is set to ensure proper
   * TAXII-compliant sorting.
   */
  private async syncCollectionObjects(
    collectionId: string,
    replace: boolean = false
  ): Promise<void> {
    try {
      // Get collection bundle from Workbench
      const bundle = await this.stixRepo.getCollectionBundle(collectionId);

      if (!bundle.objects || bundle.objects.length === 0) {
        this.logger.debug(`No objects found in collection ${collectionId}`);
        return;
      }

      // If replacing, delete existing objects for this collection
      if (replace) {
        await this.stixObjectModel.deleteMany({
          '_meta.workbenchCollection.id': collectionId
        }).exec();
      }

      // Create bulk operations array
      const bulkOps = bundle.objects.map(stixObject => {
        const entity = this.createObjectEntity(stixObject, collectionId);
        return {
          updateOne: {
            filter: {
              'stix.id': stixObject.id,
              'stix.modified': stixObject.modified,
              '_meta.workbenchCollection.id': collectionId
            },
            update: { $set: entity },
            upsert: true
          }
        };
      });

      // Execute bulk operations in batches of 1000
      for (let i = 0; i < bulkOps.length; i += 1000) {
        const batch = bulkOps.slice(i, i + 1000);
        await this.stixObjectModel.bulkWrite(batch);
      }

      this.logger.debug(
        `Synchronized ${bundle.objects.length} objects for collection ${collectionId}`
      );

    } catch (e) {
      this.logger.error(
        `Failed to sync objects for collection ${collectionId}`,
        e.stack
      );
      throw e;
    }
  }

  /**
   * Scheduled job that maintains synchronization between Workbench and TAXII.
   * 
   * This is the main entry point for the collection and object synchronization
   * process. It:
   * 1. Retrieves current collections from Workbench
   * 2. Removes any orphaned TAXII collections
   * 3. Processes each Workbench collection, handling collisions
   * 4. Synchronizes objects for updated collections
   * 
   * The job runs every 30 minutes to ensure the TAXII server stays current
   * with Workbench content.
   */
  @Cron(CronExpression.EVERY_30_MINUTES, {
    name: GET_TAXII_RESOURCES_JOB_TOKEN,
  })
  async findAndStoreTaxiiResources(): Promise<void> {
    this.logger.debug('Starting database collection and object hydration');

    try {
      // Get collections from Workbench
      const workbenchCollections = await this.stixRepo.getCollections();
      this.logger.debug(
        `Successfully retrieved ${workbenchCollections.length} collections from Workbench`
      );

      // Handle orphaned collections first
      await this.handleOrphanedCollections(workbenchCollections);

      // Process each collection
      for (const workbenchCollection of workbenchCollections) {
        try {
          // Handle collision and sync collection
          const shouldSyncObjects = await this.handleCollisionAndSync(workbenchCollection);

          // Sync objects if collection was created/updated
          if (shouldSyncObjects) {
            await this.syncCollectionObjects(
              workbenchCollection.stix.id,
              true // replace existing objects when collection is updated
            );
          }

          this.logger.debug(
            `Processed collection '${workbenchCollection.stix.id}'`
          );
        } catch (e) {
          this.logger.error(
            `Failed to process collection ${workbenchCollection.stix.id}`,
            e.stack
          );
        }
      }
    } catch (e) {
      this.logger.error("Failed to retrieve collections from Workbench", e.stack);
      throw e;
    }
  }

  /**
   * Manual trigger for hydration process.
   * 
   * This method provides a way to manually trigger the hydration process
   * outside of the scheduled job. It's useful for:
   * - Initial data population
   * - Forced updates after Workbench changes
   * - Testing and verification
   */
  async hydrate(): Promise<void> {
    this.logger.debug('Manual hydration process triggered');
    await this.findAndStoreTaxiiResources();
  }
}