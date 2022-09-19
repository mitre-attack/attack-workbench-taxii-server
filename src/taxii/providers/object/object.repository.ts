import { Inject, Injectable } from "@nestjs/common";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { StixObjectInterface } from "src/stix/interfaces/stix-object.interface";
import { InjectModel } from "@nestjs/mongoose";
import {
  AttackObject,
  AttackObjectDocument,
} from "src/hydrate/collector/schema/attack-object.schema";
import { Cursor, Model } from "mongoose";
import { STIX_REPO_TOKEN } from "src/stix/constants";
import { StixRepositoryInterface } from "src/stix/providers/stix.repository.interface";
import {
  TaxiiBadRequestException,
  TaxiiNotFoundException,
} from "../../../common/exceptions";
import { StixObjectPropertiesInterface } from "../../../stix/interfaces/stix-object-properties.interface";
import { isDefined } from "class-validator";
import { StixObjectDto } from "../../../stix/dto/stix-object.dto";

@Injectable()
export class ObjectRepository {
  /**
   * Instantiates an instance of the ObjectRepository service class
   * @param logger
   * @param stixRepo
   * @param attackObjectsModel
   */
  constructor(
    private readonly logger: Logger,
    @Inject(STIX_REPO_TOKEN) private readonly stixRepo: StixRepositoryInterface,
    @InjectModel(AttackObject.name)
    private attackObjectsModel: Model<AttackObjectDocument>
  ) {
    logger.setContext(ObjectRepository.name);
  }

  /**
   * Gets an array of all available STIX objects. This method is collection-agnostic.
   */
  // TODO implement this method
  // async findAll(): Promise<StixObjectInterface[]> {
  //   // TODO re-write this method
  //   return await this.stixRepo.getAllStixObjects();
  // }

  /**
   * Get an iterable stream of STIX objects from the database
   * @param collectionId Specifies the collection of objects that should be returned
   */
  async *findByCollectionId(
    collectionId: string
  ): AsyncIterableIterator<AttackObject> {
    const cursor = this.attackObjectsModel
      .find({
        collection_id: collectionId,
      })
      .cursor();

    for (
      let doc = await cursor.next();
      doc != null;
      doc = await cursor.next()
    ) {
      yield doc;
    }

    this.logger.debug(
      `Finished streaming collection ${collectionId} from database`
    );
  }

  /**
   * Get the latest version of a STIX object
   * @param collectionId Collection identifier of the requested STIX object
   * @param objectId Identifier of the requested object
   // * @param versions
   */
  async findOne(
    collectionId: string,
    objectId: string
    // versions = false
  ): Promise<AttackObject[]> {
    // Begin by retrieving all documents that match the specified object parameters

    const attackObjects: AttackObject[] = await this.attackObjectsModel
      .find({
        collection_id: collectionId,
        "stix.id": { $eq: objectId },
      })
      .exec();

    // this.logger.debug(
    //   `OBJECTS RETURNED FROM DB: ${JSON.stringify(attackObjects, null, 4)}`
    // );

    // Raise an exception if an empty array was received. We need at least one object to process anything. Something is
    // probably broken if an empty array is getting passed around.

    if (attackObjects.length === 0) {
      throw new TaxiiNotFoundException({
        title: "No Objects Found",
        description: "No objects matching the specified filters were found.",
      });
    }

    return attackObjects;

    // If only one STIX object was retrieved, we can just return it. Otherwise, we may need to filter the objects
    // depending on whether 'versions' was set or not.

    // if (allVersionsOfObject.length == 1) {
    //   return allVersionsOfObject;
    // }

    // If the versions parameter was set to true, then all versions of the object should be returned.

    // if (String(versions) === "true") {
    //   return allVersionsOfObject;
    // } else {
    //   // Otherwise, only the latest/newest version of the object should be returned.
    //
    //   // Use a placeholder to track the latest object. Iterate over the objects array and update the placeholder ref any
    //   // time that the current object in the iteration is found to be newer than the placeholder object.
    //
    //   let latestObject: StixObjectDto = allVersionsOfObject[0];
    //
    //   for (let i = 1; i < allVersionsOfObject.length; i++) {
    //     // filter by modified if the property exists, otherwise filter by created
    //
    //     const currentObject = allVersionsOfObject[i];
    //
    //     // Default to filtering by modified
    //     if (
    //       isDefined(latestObject.stix.modified) &&
    //       isDefined(currentObject.stix.modified)
    //     ) {
    //       // modified property exists on both objects!
    //       if (latestObject.stix.modified > currentObject.stix.modified) {
    //         // found an object with a newer modified date. updating placeholder...
    //         latestObject = currentObject;
    //       }
    //
    //       // Fallback to filtering by created
    //     } else if (
    //       isDefined(latestObject.stix.created) &&
    //       isDefined(currentObject.stix.created)
    //     ) {
    //       // created property exists on both objects!
    //       if (latestObject.stix.created > currentObject.stix.created) {
    //         // found an object with a newer created date. updating placeholder...
    //         latestObject = currentObject;
    //       }
    //     }
    //   }
    //   // Return an array containing the latest (placeholder) object
    //   return [latestObject];
    // }

    // return await this.stixRepo.getAnObject(collectionId, objectId, versions);
  }
}
