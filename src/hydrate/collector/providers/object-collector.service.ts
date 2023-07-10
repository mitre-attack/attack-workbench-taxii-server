import { Inject, Injectable, Logger, LoggerService } from "@nestjs/common";
import { FilterQuery, Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { StixObjectInterface } from "src/stix/interfaces/stix-object.interface";
import { AttackObjectDto } from "src/stix/dto/attack-object.dto";
import { AttackObject } from "../schema";
import { STIX_REPO_TOKEN } from "../../../stix/constants";
import { StixRepositoryInterface } from "../../../stix/providers/stix.repository.interface";
import { GET_ATTACK_OBJECTS_JOB_TOKEN } from "../constants";
import { StixObjectDto } from "../../../stix/dto/stix-object.dto";

const stixOptionalArrayProperties = [
  "x_mitre_aliases",
  "x_mitre_contributors",
  "x_mitre_data_sources",
  "x_mitre_defense_bypassed",
  "x_mitre_domains",
  "x_mitre_effective_permissions",
  "x_mitre_impact_type",
  "x_mitre_system_requirements",
  "x_mitre_permissions_required",
  "x_mitre_platforms",
  "x_mitre_remote_support",
  "x_mitre_tactic_type",
  "external_references",
  "kill_chain_phases",
  "aliases",
  "object_marking_refs",
  "roles",
  "sectors",
];

@Injectable()
export class ObjectCollectorService {
  private readonly logger: LoggerService = new Logger(
    ObjectCollectorService.name
  );

  constructor(
    @Inject(STIX_REPO_TOKEN) private readonly workbench: StixRepositoryInterface,
    @InjectModel(AttackObject.name) private stixObjectModel: Model<AttackObject>
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES, { name: GET_ATTACK_OBJECTS_JOB_TOKEN })
  async findAndStoreStixObjects() {
    this.logger.debug("Starting database object hydration");
    /**
     * 1. Get all objects
     * 2. Push each object to its respective collection
     *
     * UPDATE:
     * 1. Get all available collection IDs
     * 2. For each collection ID, request the respective collection bundle
     * 3. Push { collection_id, stix } for each object retrieved
     */
    const allAttackObjects: StixObjectInterface[] = await this.workbench.getAllStixObjects(false);

    this.logger.debug(`Retrieved ${allAttackObjects.length} ATT&CK objects`);

    /**
     * Pass the STIX-2.1 objects to the transform function.
     * The transform function should return a new array of size 2(n).
     * Half of the elements will be STIX-2.0 objects. The other half should be the original/unchanged set of
     * STIX-2.1 objects.
     */
    const objectsToWriteToDatabase = [];

    allAttackObjects.map((attackObject) => {
      /**
       * First, generate an equivalent STIX-2.0 object for every STIX-2.1 object in the dataset. Store the generated
       * object in a temporary array. We'll merge it back in later.
       */
      const stix_20_Object = this.convertStixObjectToVersion(
        <AttackObjectDto>attackObject,
        "2.0"
      );
      objectsToWriteToDatabase.push(stix_20_Object);

      const stix_21_Object = this.convertStixObjectToVersion(
        <AttackObjectDto>attackObject,
        "2.1"
      );
      objectsToWriteToDatabase.push(stix_21_Object);
    });
    /**
     * Now merge the STIX-2.1 objects with the STIX-2.0 objects. All of them will be stored in the database.
     */
    // allAttackObjects = [...objectsToWriteToDatabase, ...allAttackObjects];

    // Sort the list of objects returned from Workbench now, before we write them to the database; pre-sorting the mongo
    // collection now means we don't need to sort TAXII responses later
    objectsToWriteToDatabase.sort((a, b) => {
      const createdA = new Date(a.stix.created).valueOf();
      const createdB = new Date(b.stix.created).valueOf();
      if (createdA < createdB) {
        return -1;
      }
      if (createdA > createdB) {
        return 1;
      }
      return 0;
    });

    this.logger.debug(
      `Processed ${objectsToWriteToDatabase.length} ATT&CK objects`
    );

    // Write object to the database using bulk operation. Creates a new document if the object does not already exist. Otherwise updates
    // the existing document.
    let bulkOps = [];

    for (const object of objectsToWriteToDatabase) {
      if ((<AttackObjectDto>object).workspace.collections.length >= 1) {
        // only operate on the object if the object has an ATT&CK ID

        // grab the collection_id for later. we're going to include the collection_id on each STIX-object document so
        // the TAXII server can easily distinguish which collection the object belongs to
        const collectionId: string = (<AttackObjectDto>object).workspace
          .collections[0].collection_ref;

        const filter: FilterQuery<AttackObject> = {
          "stix.id": { $eq: object.stix.id },
          "stix.modified": { $eq: object.stix.modified },
          "stix.created": { $eq: object.stix.created },
          "stix.spec_version": { $eq: object.stix.spec_version },
        };
        // push the updateOne operation into bulkOps array
        bulkOps.push({
          updateOne: {
            filter: filter,
            update: {
              $set: {
                collection_id: collectionId,
                stix: object.stix,
              },
            },
            upsert: true,
            strict: false, // disabling strict mode allows us to capture properties not explicitly declared in the schema
          }
        });
        // execute bulkWrite each 1000 operations (or at the end of the loop)
        if (bulkOps.length === 1000) {
          await this.stixObjectModel.bulkWrite(bulkOps);
          bulkOps = []; // clear the array
        }

        this.logger.debug(
          `Synchronized STIX object '${object.stix.id}' to TAXII database`
        );
      }
      // end if
    }

    // execute the remaining operations, if any
    if (bulkOps.length > 0) {
      await this.stixObjectModel.bulkWrite(bulkOps);
    }

    // end for
    this.logger.debug("Completed database object hydration");
  }

  convertStixObjectToVersion(
    attackObject: AttackObjectDto,
    version: string
  ): AttackObjectDto {
    const returnObject = JSON.parse(JSON.stringify(attackObject));
    if (version === "2.0") {
      // eslint-disable-next-line no-prototype-builtins
      if (returnObject.stix.hasOwnProperty("spec_version")) {
        returnObject.stix.spec_version = undefined;
      }
      // returnObject.stix.spec_version = "2.0"; // TODO review whether this is acceptable

      if (returnObject.stix.type === "malware") {
        // STIX 2.0 malware may not have the property is_family
        // eslint-disable-next-line no-prototype-builtins
        if (returnObject.stix.hasOwnProperty("is_family")) {
          returnObject.stix["is_family"] = undefined;
        }

        // STIX 2.0 malware must have the property labels
        returnObject.stix["labels"] = ["malware"];
      }

      if (returnObject.stix.type === "tool") {
        // STIX 2.0 tools may not have the property is_family
        // eslint-disable-next-line no-prototype-builtins
        if (returnObject.stix.hasOwnProperty("is_family")) {
          returnObject.stix["is_family"] = undefined;
        }

        // STIX 2.0 tools must have the property labels
        returnObject.stix.labels = ["tool"];
      }
    } else if (version == "2.1") {
      returnObject.stix.spec_version = "2.1";

      // STIX 2.1 malware must have the property is_family
      if (returnObject.stix.type === "malware") {
        returnObject.stix["is_family"] = attackObject.stix["is_family"] ?? true;
      }
    }

    this.removeEmptyArrays(returnObject.stix, stixOptionalArrayProperties);

    return returnObject;
  }

  removeEmptyArrays(attackObject: StixObjectDto, propertyNames) {
    for (const propertyName of propertyNames) {
      if (
        Array.isArray(attackObject[propertyName]) &&
        attackObject[propertyName].length === 0
      ) {
        delete attackObject[propertyName];
      }
    }
  }
}
