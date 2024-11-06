import { Inject, Injectable, Logger, LoggerService } from "@nestjs/common";
import { FilterQuery, Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
// import { stixBundleSchema, StixBundle, type AttackObject } from "@mitre-attack/attack-data-model";

import { StixObjectInterface } from "src/stix/interfaces/stix-object.interface";
import { AttackObjectDto } from "src/stix/dto/attack-object.dto";

import { STIX_REPO_TOKEN } from "../../../stix/constants";
import { StixRepositoryInterface } from "../../../stix/providers/stix.repository.interface";
import { GET_ATTACK_OBJECTS_JOB_TOKEN } from "../constants";
import { StixObjectDto } from "../../../stix/dto/stix-object.dto";
import { AttackObject as MongooseAttackObject } from "../schema";
import { z } from "zod";



@Injectable()
export class ObjectCollectorService {
  private readonly logger: LoggerService = new Logger(ObjectCollectorService.name);

  constructor(
    @Inject(STIX_REPO_TOKEN) private readonly workbench: StixRepositoryInterface,
    @InjectModel(MongooseAttackObject.name) private stixObjectModel: Model<MongooseAttackObject>
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES, { name: GET_ATTACK_OBJECTS_JOB_TOKEN })
  async findAndStoreStixObjects() {
    this.logger.debug("Starting database object hydration");

    const { stixBundleSchema } = await import("@mitre-attack/attack-data-model");

    // Retrieve all collection IDs from the repository
    const stixCollections = await this.workbench.getCollections();
    const collectionIds = stixCollections.map((collection) => collection.stix.id);

    const objectsToWriteToDatabase = [];
    const bundlesWithErrors: { bundleIndex: number; errors: string[] }[] = [];

    // For each collection ID, retrieve the STIX 2.1 bundle of objects
    for (const collectionId of collectionIds) {
      const stixBundle: z.infer<typeof stixBundleSchema> = await this.workbench.getStixBundle(collectionId);
      this.logger.debug(`Retrieved bundle for collection ID ${collectionId}`);

      // If the bundle is valid, process each object within the bundle
      stixBundle.objects.forEach((stixObject) => {
        objectsToWriteToDatabase.push({
          collection_id: collectionId,
          stix: stixObject,
        });
      });
    }

    this.logger.debug(`Processed ${objectsToWriteToDatabase.length} ATT&CK objects`);

    // Write objects to the database using bulk operation
    let bulkOps = [];

    for (const object of objectsToWriteToDatabase) {
      const filter: FilterQuery<MongooseAttackObject> = {
        "stix.id": { $eq: object.stix.id },
        "stix.modified": { $eq: object.stix.modified },
        "stix.created": { $eq: object.stix.created },
        "stix.spec_version": { $eq: object.stix.spec_version },
      };

      bulkOps.push({
        updateOne: {
          filter,
          update: {
            $set: {
              collection_id: object.collection_id,
              stix: object.stix,
            },
          },
          upsert: true,
          strict: false,
        },
      });

      if (bulkOps.length === 1000) {
        await this.stixObjectModel.bulkWrite(bulkOps);
        bulkOps = []; // Clear the array for the next batch of operations
      }

      this.logger.debug(`Synchronized STIX object '${object.stix.id}' to TAXII database`);
    }

    // Execute any remaining operations in bulk
    if (bulkOps.length > 0) {
      await this.stixObjectModel.bulkWrite(bulkOps);
    }

    // Log a summary of the validation results
    this.logger.log(`Validated ${collectionIds.length} bundles`);
    this.logger.log(`Found errors in ${bundlesWithErrors.length} bundles`);

    this.logger.debug("Completed database object hydration");
  }
}
