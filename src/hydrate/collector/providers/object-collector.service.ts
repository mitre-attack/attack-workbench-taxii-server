import { Inject, Injectable, Logger, LoggerService } from "@nestjs/common";
import { FilterQuery, Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { AttackObjectDto } from "src/stix/dto/attack-object.dto";
import { AttackObjectEntity } from "../schema";
import { STIX_REPO_TOKEN } from "../../../stix/constants";
import { StixRepositoryInterface } from "../../../stix/providers/stix.repository.interface";
import { GET_ATTACK_OBJECTS_JOB_TOKEN } from "../constants";
import { StixBundleDto } from "src/stix/dto/stix-bundle.dto";
import { WorkbenchCollectionDto } from "src/stix/dto/workbench-collection.dto";

@Injectable()
export class ObjectCollectorService {
  private readonly logger: LoggerService = new Logger(ObjectCollectorService.name);

  constructor(
    @Inject(STIX_REPO_TOKEN) private readonly workbench: StixRepositoryInterface,
    @InjectModel(AttackObjectEntity.name) private stixObjectModel: Model<AttackObjectEntity>
  ) {}

  private async processStixBundles(domain: 'enterprise-attack' | 'ics-attack' | 'mobile-attack', collectionId: string) {
    const objectsToWriteToDatabase = [];

    const stixBundles = [
      { version: '2.0', bundle: await this.workbench.getStixBundle(domain, '2.0') },
      { version: '2.1', bundle: await this.workbench.getStixBundle(domain, '2.1') },
    ];

    for (const { version, bundle } of stixBundles) {
      this.logger.debug(`Retrieved STIX ${version} Bundle for ATT&CK domain '${domain}' - Object Count: ${bundle.objects.length}`);
      bundle.objects.forEach((stixObject) => {
        objectsToWriteToDatabase.push({
          collection_id: collectionId,
          stix: stixObject,
          created_at: new Date().toISOString(), // Add created_at field to capture the current timestamp
        });
      });
    }

    return objectsToWriteToDatabase;
  }

  @Cron(CronExpression.EVERY_30_MINUTES, { name: GET_ATTACK_OBJECTS_JOB_TOKEN })
  async findAndStoreStixObjects() {
    this.logger.debug("Starting database object hydration");

    const objectsToWriteToDatabase = [];
    const stixCollections = await this.workbench.getCollections();
    this.logger.debug(`Retrieved ${stixCollections.length} collections`);

    for (const collection of stixCollections) {
      this.logger.debug(`Processing STIX bundle: ${collection.stix.name}`);

      let results = [];
      switch (collection.stix.name) {
        case "Enterprise ATT&CK":
          results = await this.processStixBundles('enterprise-attack', collection.stix.id);
          break;
        case "ICS ATT&CK":
          results = await this.processStixBundles('ics-attack', collection.stix.id);
          break;
        case "Mobile ATT&CK":
          results = await this.processStixBundles('mobile-attack', collection.stix.id);
          break;
        default:
          continue;
      }
      objectsToWriteToDatabase.push(...results);
    }

    if (objectsToWriteToDatabase.length === 0) {
      this.logger.debug("No objects to write to the database");
      return;
    }

    this.logger.debug(`Processed ${objectsToWriteToDatabase.length} ATT&CK objects`);
    // Sort the list of objects by the 'created' date in ascending order.
    // This works by calculating the difference between timestamps directly:
    // - If 'a' was created earlier than 'b', the result is negative (placing 'a' before 'b').
    // - If 'a' was created later than 'b', the result is positive (placing 'b' before 'a').
    // - If they were created at the same time, the result is 0 (no change in order).
    objectsToWriteToDatabase.sort((a, b) => new Date(a.stix.created).valueOf() - new Date(b.stix.created).valueOf());

    objectsToWriteToDatabase.sort((a, b) => new Date(a.stix.created).valueOf() - new Date(b.stix.created).valueOf());

    let bulkOps = [];
    for (const object of objectsToWriteToDatabase) {
      const filter: FilterQuery<AttackObjectEntity> = {
        "stix.id": { $eq: object.stix.id },
        "stix.modified": { $eq: object.stix.modified },
        "stix.created": { $eq: object.stix.created },
        "stix.spec_version": { $eq: object.stix.spec_version },
      };

      bulkOps.push({
        updateOne: {
          filter,
          update: {
            $setOnInsert: { created_at: object.created_at }, // Only set created_at if this is a new document
            $set: {
              collection_id: object.collection_id,
              stix: object.stix,
            },
          },
          upsert: true, // If the object doesn't exist, insert a new document. If it does exist, update the existing document
          strict: false, // Disabling strict mode allows us to capture properties not explicitly declared in the schema
        },
      });

      // Execute bulkWrite for every 1000 operations or at the end of the loop
      if (bulkOps.length === 1000) {
        await this.stixObjectModel.bulkWrite(bulkOps);
        bulkOps = []; // Clear the array for the next batch of operations
      }
    }

    // execute the remaining operations, if any
    if (bulkOps.length > 0) {
      await this.stixObjectModel.bulkWrite(bulkOps);
    }

    this.logger.debug("Completed database object hydration");
  }
}
