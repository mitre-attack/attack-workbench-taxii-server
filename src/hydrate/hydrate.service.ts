import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectModel } from "@nestjs/mongoose";
import { Logger } from "@nestjs/common";
import { LoggerService } from "@nestjs/common/services/logger.service";
import { Model, Types } from "mongoose";
import * as mongoose from "mongoose";
import { TaxiiCollectionEntity, TaxiiCollectionDocument, AttackObjectEntity, AttackObjectDocument } from "./schema";
import { TaxiiCollectionDto } from "src/taxii/providers/collection/dto";
import { WorkbenchCollectionDto } from "src/stix/dto/workbench-collection.dto";
import { STIX_REPO_TOKEN } from "src/stix/constants";
import { StixRepositoryInterface } from "src/stix/providers/stix.repository.interface";
import { GET_TAXII_RESOURCES_JOB_TOKEN, HYDRATE_OPTIONS_TOKEN } from "./constants";
import { HydrateConnectOptions } from "./interfaces/hydrate-connect.options";
import { SemverParts } from "./interfaces/semver-parts.interface";

/**
 * Interface for the collision handling response
 */
interface CollisionHandlingResult {
  shouldSync: boolean;
  collectionId: Types.ObjectId | null;
}

/**
 * Service responsible for synchronizing TAXII collections and objects with ATT&CK Workbench.
 * 
 * This service handles two main responsibilities:
 * 1. Collection Management: Synchronizing TAXII collections with Workbench collections
 * 2. Object Management: Maintaining STIX objects associated with each collection
 * 
 * Key Features:
 * - Version Control: Maintains active/inactive state for collections and objects
 * - Collection Relationships: Objects reference their parent collection via MongoDB ObjectId
 * - Collision Detection: Handles cases where a Workbench collection shares a title with an existing TAXII collection
 * - Drift Management: Deactivates orphaned TAXII collections when corresponding Workbench collections are deleted
 * - TAXII-Compliant Sorting: Ensures objects are retrievable in ascending order by addition date per TAXII 2.1 spec
 * 
 * @remarks
 * The service maintains a close relationship between TAXII collections and Workbench collections.
 * A TAXII collection in this implementation *is* a Workbench collection - they have a 1:1 relationship.
 * If no collections have been published in Workbench, the TAXII server will have no collections.
 * Versioning is handled through active/inactive states rather than updates or deletions.
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
   * Initializes the service when the module starts.
   * 
   * - Ensures required database indexes exist
   * - Triggers initial hydration if configured
   * 
   * Per TAXII 2.1 specification section 3.4:
   * "For Object and Manifest Endpoints, objects returned MUST be sorted in ascending 
   * order by the date it was added. Meaning, the most recently added object is last in the list."
   * 
   * @remarks
   * The index is created with { background: true } to avoid blocking database operations
   * during index creation. This is important for production deployments where the
   * collection may already contain data.
   */
  async onModuleInit() {
    try {
      // Ensure TAXII-compliant sorting index
      await this.ensureIndex(
        this.stixObjectModel.collection,
        { '_meta.createdAt': 1 },
        {
          background: true,
          name: 'taxii_object_sorting'
        }
      );

      // Ensure index for retrieving objects by collection
      await this.ensureIndex(
        this.stixObjectModel.collection,
        {
          '_meta.collectionRef.id': 1,
          '_meta.active': 1
        },
        {
          background: true,
          name: 'taxii_objects_by_collection'
        }
      );

      // Ensure index for retrieving specific objects
      await this.ensureIndex(
        this.stixObjectModel.collection,
        {
          '_meta.collectionRef.id': 1,
          'stix.id': 1,
          '_meta.active': 1
        },
        {
          background: true,
          name: 'taxii_object_lookup'
        }
      );

      this.logger.debug('Ensured TAXII-compliant indexes exist');

      if (this.options.hydrateOnBoot) {
        this.logger.debug('Hydration on boot enabled - starting initial hydration');
        await this.hydrate();
      }
    } catch (error) {
      this.logger.error('Failed to ensure indexes', error);
      throw error;
    }
  }

  /**
   * Safely ensures an index exists.
   */
  private async ensureIndex(
    collection: any,
    indexSpec: object,
    options: object = {}
  ): Promise<void> {
    try {
      await collection.createIndex(indexSpec, options);
      this.logger.debug(`Successfully created/verified index: ${JSON.stringify(indexSpec)}`);
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        this.logger.debug(`Index already exists for spec: ${JSON.stringify(indexSpec)}`);
        return;
      }
      throw error;
    }
  }

  /**
   * Safely converts a string or Date to a Date object.
   * Returns current date if input is invalid.
   * 
   * @param date - The date to convert
   * @returns A valid Date object
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
   * @returns A new TAXII collection entity with metadata
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
        createdAt: new Date(),
        active: true
      }
    });
  }

  private createCollectionRef(workbenchCollection: WorkbenchCollectionDto) {
    return {
      id: workbenchCollection.stix.id,
      title: workbenchCollection.stix.name,
      version: workbenchCollection.stix.x_mitre_version,
      modified: this.safeDate(workbenchCollection.stix.modified)
    };
  }

  /**
   * Creates a new STIX object entity with proper metadata.
   * 
   * @param stixObject - The raw STIX object from Workbench
   * @param collectionId - MongoDB ObjectId of the parent collection
   * @returns A new STIX object entity with required metadata
   * 
   * @remarks
   * The _meta.createdAt field is crucial as it's used to implement TAXII's
   * requirement for sorting objects by addition date.
   */
  private createObjectEntity(
    stixObject: any,
    collectionRef: ReturnType<typeof this.createCollectionRef>
  ): AttackObjectEntity {
    return {
      stix: stixObject,
      _meta: {
        collectionRef,
        stixSpecVersion: '2.1', // always 2.1 because Workbench Collection Bundles only contain 2.1 objects
        createdAt: new Date(),
        active: true
      }
    };
  }

  /**
   * Parses a semantic version string into its constituent parts.
   * 
   * @param version - Version string (e.g., "16.0.1")
   * @returns Object containing major, minor, and patch numbers
   * 
   * @example
   * // Returns { major: 16, minor: 0, patch: 1 }
   * parseSemverString("16.0.1")
   * 
   * @example
   * // Returns { major: 16, minor: 0, patch: 0 }
   * parseSemverString("16.0")
   */
  private parseSemverString(version: string): SemverParts {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  }

  /**
   * Compares two semantic version strings according to semver rules.
   * 
   * @param version1 - First version string
   * @param version2 - Second version string
   * @returns true if version1 is greater than version2
   * 
   * @example
   * // Returns true
   * compareSemver("16.1.0", "16.0.0")
   * 
   * @example
   * // Returns false
   * compareSemver("16.0", "16.0.1")
   */
  private compareSemver(version1: string, version2: string): boolean {
    const v1 = this.parseSemverString(version1);
    const v2 = this.parseSemverString(version2);

    // Compare major versions first
    if (v1.major !== v2.major) {
      return v1.major > v2.major;
    }

    // If major versions are equal, compare minor versions
    if (v1.minor !== v2.minor) {
      return v1.minor > v2.minor;
    }

    // If major and minor versions are equal, compare patch versions
    return v1.patch > v2.patch;
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
      `Comparing versions - Workbench: ${workbenchVersion}, Existing: ${existingVersion}`
    );

    // If versions are different, compare them
    if (workbenchVersion !== existingVersion) {
      const comparison = this.compareSemver(workbenchVersion, existingVersion);
      this.logger.debug(`Versions differ - comparison result: ${comparison}`);
      return comparison;
    }

    // If versions are the same, compare modified dates
    const workbenchModified = this.safeDate(workbenchCollection.stix.modified);
    const existingModified = existingCollection._meta.workbenchCollection.modified;

    this.logger.debug(
      `Versions match, comparing dates - Workbench: ${workbenchModified}, Existing: ${existingModified}`
    );

    return workbenchModified > existingModified;
  }

  /**
   * Handles potential collisions between Workbench and TAXII collections.
   * 
   * A collision occurs when a Workbench collection has the same title as an
   * existing TAXII collection. In such cases, we compare versions and:
   * 1. If Workbench version is newer:
   *    - Mark existing collection and its objects as inactive
   *    - Create new active collection
   * 2. If existing version is newer:
   *    - Keep existing collection
   * 
   * @param workbenchCollection - The collection from Workbench to process
   * @returns Object containing sync status and collection ID for object creation
   */
  private async handleCollisionAndSync(
    workbenchCollection: WorkbenchCollectionDto
  ): Promise<boolean> {
    this.logger.debug('Handling collision and synchronization of TAXII collections...');

    const existingCollection = await this.collectionModel.findOne({
      title: workbenchCollection.stix.name,
      '_meta.active': true
    }).exec();

    if (!existingCollection) {
      this.logger.debug('No collision detected - creating new TAXII collection');
      const taxiiEntity = this.createTaxiiCollectionEntity(workbenchCollection);
      await this.collectionModel.create(taxiiEntity);
      return true;
    }

    if (this.isNewer(workbenchCollection, existingCollection)) {
      this.logger.debug('Collision detected - creating new version and deactivating old');

      // Mark existing collection as inactive
      await this.collectionModel.findByIdAndUpdate(
        existingCollection._id,
        { '$set': { '_meta.active': false } }
      );

      // Mark existing collection's objects as inactive
      await this.stixObjectModel.updateMany(
        {
          '_meta.collectionRef.id': existingCollection.id,
          '_meta.active': true
        },
        { '$set': { '_meta.active': false } }
      );

      // Create new active collection
      const taxiiEntity = this.createTaxiiCollectionEntity(workbenchCollection);
      await this.collectionModel.create(taxiiEntity);

      return true;
    }

    this.logger.debug('Collision detected - keep existing collection');
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
   * Instead of deleting orphaned collections, we mark them (and their objects)
   * as inactive to maintain history.
   * 
   * @param workbenchCollections - Current list of collections from Workbench
   */
  private async handleOrphanedCollections(
    workbenchCollections: WorkbenchCollectionDto[]
  ): Promise<void> {
    try {
      const workbenchTitles = new Set(
        workbenchCollections.map(collection => collection.stix.name)
      );

      const orphanedCollections = await this.collectionModel
        .find({
          title: { $nin: Array.from(workbenchTitles) },
          '_meta.active': true
        })
        .exec();

      if (orphanedCollections.length === 0) {
        this.logger.debug('No orphaned collections found');
        return;
      }

      // Mark collections as inactive
      await this.collectionModel.updateMany(
        { _id: { $in: orphanedCollections.map(c => c._id) } },
        { '$set': { '_meta.active': false } }
      );

      // Mark their objects as inactive
      await this.stixObjectModel.updateMany(
        { '_meta.collectionRef.id': { $in: orphanedCollections.map(c => c.id) } },
        { '$set': { '_meta.active': false } }
      );

      this.logger.debug(
        `Marked ${orphanedCollections.length} collections and their objects as inactive`
      );

    } catch (e) {
      this.logger.error('Failed to handle orphaned collections', e.stack);
      throw e;
    }
  }

  /**
   * Synchronizes STIX objects for a given collection.
   * 
   * This method is responsible for:
   * 1. Retrieving the collection's objects from Workbench
   * 2. Creating new object documents with proper collection references
   * 3. Maintaining TAXII-compliant addition dates for sorting
   * 
   * @param collectionId - MongoDB ObjectId of the collection
   * @param workbenchId - Workbench ID of the collection for fetching objects
   * 
   * @remarks
   * Implements bulk operations for efficiency, processing objects in batches.
   * Each object is created with an active state and proper collection reference.
   */
  private async syncCollectionObjects(
    workbenchCollection: WorkbenchCollectionDto
  ): Promise<void> {
    try {
      const bundle = await this.stixRepo.getCollectionBundle(workbenchCollection.stix.id);

      if (!bundle.objects || bundle.objects.length === 0) {
        this.logger.debug(`No objects found in collection ${workbenchCollection.stix.id}`);
        return;
      }

      // Create collection reference once for all objects
      const collectionRef = this.createCollectionRef(workbenchCollection);

      // Create new objects with embedded collection reference
      const bulkOps = bundle.objects.map(stixObject => ({
        insertOne: {
          document: this.createObjectEntity(stixObject, collectionRef)
        }
      }));

      // Execute bulk operations in batches
      for (let i = 0; i < bulkOps.length; i += 1000) {
        const batch = bulkOps.slice(i, i + 1000);
        await this.stixObjectModel.bulkWrite(batch);
      }

      this.logger.debug(
        `Synchronized ${bundle.objects.length} objects for collection ${workbenchCollection.stix.id}`
      );

    } catch (e) {
      this.logger.error(
        `Failed to sync objects for collection ${workbenchCollection.stix.id}`,
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
   * 2. Handles orphaned TAXII collections
   * 3. Processes each Workbench collection, handling collisions
   * 4. Synchronizes objects for updated collections
   * 
   * The job runs every 30 minutes to ensure the TAXII server stays current
   * with Workbench content.
   * 
   * @remarks
   * Uses active/inactive state management rather than updates/deletes to maintain
   * version history and avoid document conflicts.
   */
  @Cron(CronExpression.EVERY_30_MINUTES, {
    name: GET_TAXII_RESOURCES_JOB_TOKEN,
  })
  async findAndStoreTaxiiResources(): Promise<void> {
    this.logger.debug('Starting database collection and object hydration');

    try {
      const workbenchCollections = await this.stixRepo.getCollections();
      this.logger.debug(
        `Successfully retrieved ${workbenchCollections.length} collections from Workbench`
      );

      await this.handleOrphanedCollections(workbenchCollections);

      for (const workbenchCollection of workbenchCollections) {
        try {
          const shouldSync = await this.handleCollisionAndSync(workbenchCollection);

          if (shouldSync) {
            await this.syncCollectionObjects(workbenchCollection);
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