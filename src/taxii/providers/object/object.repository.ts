import { Injectable } from "@nestjs/common";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { InjectModel } from "@nestjs/mongoose";
import {
  AttackObjectEntity,
  AttackObjectDocument,
} from "src/hydrate/schema/attack-object.schema";
import { Model } from "mongoose";
import { TaxiiNotFoundException } from "src/common/exceptions";

@Injectable()
export class ObjectRepository {
  /**
   * Instantiates an instance of the ObjectRepository service class
   * @param logger
   * @param attackObjectsModel
   */
  constructor(
    private readonly logger: Logger,
    @InjectModel(AttackObjectEntity.name)
    private attackObjectsModel: Model<AttackObjectDocument>
  ) {
    logger.setContext(ObjectRepository.name);
  }

  /**
   * Get an iterable stream of STIX objects from the database
   * @param collectionId Specifies the collection of objects that should be returned
   */
  async *findByCollectionId(
    collectionId: string
  ): AsyncIterableIterator<AttackObjectEntity> {
    const cursor = this.attackObjectsModel
      .find({
        '_meta.workbenchCollection.id': collectionId
      })
      .sort({ '_meta.createdAt': 1 }) // Automatically uses the index on _meta.createdAt to sort the results
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
  ): Promise<AttackObjectEntity[]> {
    // Begin by retrieving all documents that match the specified object parameters

    const attackObjects: AttackObjectEntity[] = await this.attackObjectsModel
      .find({
        '_meta.workbenchCollection.id': collectionId,
        "stix.id": { $eq: objectId },
      })
      .sort({ '_meta.createdAt': 1 }) // Automatically uses the index on _meta.createdAt to sort the results
      .exec();

    // Raise an exception if an empty array was received. We need at least one object to process anything. Something is
    // probably broken if an empty array is getting passed around.

    if (attackObjects.length === 0) {
      throw new TaxiiNotFoundException({
        title: "No Objects Found",
        description: "No objects matching the specified filters were found.",
      });
    }

    return attackObjects;
  }
}
