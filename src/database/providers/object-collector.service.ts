import { Inject, Injectable, Logger, LoggerService } from "@nestjs/common";
import { FilterQuery, Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { StixObjectInterface } from "src/stix/interfaces/stix-object.interface";
import { AttackObjectDto } from "src/stix/dto/attack-object.dto";
import { AttackObject } from "../schema";
import { STIX_REPO_TOKEN } from "../../stix/constants";
import { StixRepositoryInterface } from "../../stix/providers/stix.repository.interface";
import { GET_ATTACK_OBJECTS_JOB_TOKEN } from "../constants";
import { FilterService } from "src/taxii/providers";

@Injectable()
export class ObjectCollectorService {
  private readonly logger: LoggerService = new Logger(
    ObjectCollectorService.name
  );

  constructor(
    @Inject(STIX_REPO_TOKEN)
    private readonly workbench: StixRepositoryInterface,
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
    const allAttackObjects: StixObjectInterface[] =
      await this.workbench.getAllStixObjects(false);

    this.logger.debug(`Retrieved ${allAttackObjects.length} ATT&CK objects`);

    // Sort the list of objects returned from Workbench now, before we write them to the database; pre-sorting the mongo
    // collection now means we don't need to sort TAXII responses later
    allAttackObjects.sort((a, b) => {
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

    // Write each object to the database. Creates a new document if the object does not already exist. Otherwise updates
    // the existing document.
    for (const object of allAttackObjects) {
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
        };
        await this.stixObjectModel
          .updateOne(
            filter,
            {
              collection_id: collectionId,
              stix: object.stix,
            },
            {
              upsert: true,
              strict: false, // strict mode allows us to capture properties not explicitly declared in the schema
            }
          )
          .exec();
        this.logger.debug(
          `Synchronized STIX object '${object.stix.id}' to TAXII database`
        );
      }
      // end if
    }

    // end for
    this.logger.debug("Completed database object hydration");
  }
}
