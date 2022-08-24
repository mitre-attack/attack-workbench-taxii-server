import { Inject, Injectable } from "@nestjs/common";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { StixObjectInterface } from "src/stix/interfaces/stix-object.interface";
import { InjectModel } from "@nestjs/mongoose";
import {
  AttackObject,
  AttackObjectDocument,
} from "src/database/schema/attack-object.schema";
import { Cursor, Model } from "mongoose";
import { STIX_REPO_TOKEN } from "src/stix/constants";
import { StixRepositoryInterface } from "src/stix/providers/stix.repository.interface";

@Injectable()
export class ObjectMongoRepository {
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
    logger.setContext(ObjectMongoRepository.name);
  }

  /**
   * Gets an array of all available STIX objects. This method is collection-agnostic.
   */
  // TODO implement this method
  // async findAll(): Promise<StixObjectInterface[]> {
  //   // TODO re-write this method
  //   return await this.stixRepo.getAllStixObjects();
  // }

  async *streamObjectsFromDatabase(
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
      // this.logger.debug(`yielding object ${doc.stix.id}`);
      yield doc;
    }

    this.logger.debug(
      `Finished streaming collection ${collectionId} from database`
    );
  }

  /**
   * Gets all STIX objects in a given collection
   * @param collectionId The unique identifier of the STIX collection
   */
  // async findByCollection(collectionId: string): Promise<StixBundleInterface> {
  async findByCollection(collectionId: string): Promise<AttackObject[]> {
    // TODO validate this method
    return await this.attackObjectsModel
      .find({
        collection_id: collectionId,
      })
      .exec();
  }

  /**
   * Get the latest version of a STIX object
   * @param collectionId Collection identifier of the requested STIX object
   * @param objectId Identifier of the requested object
   * @param versions
   */
  async findOne(
    collectionId: string,
    objectId: string,
    versions = false
  ): Promise<StixObjectInterface[]> {
    // TODO re-write this method
    return await this.stixRepo.getAnObject(collectionId, objectId, versions);
  }
}
