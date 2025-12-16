// object.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaxiiNotFoundException } from 'src/common/exceptions';
import { TaxiiLoggerService as Logger } from 'src/common/logger';
import { AttackObjectDocument, AttackObjectEntity } from 'src/hydrate/schema/attack-object.schema';

@Injectable()
export class ObjectRepository {
  constructor(
    private readonly logger: Logger,
    @InjectModel(AttackObjectEntity.name)
    private attackObjectsModel: Model<AttackObjectDocument>,
  ) {
    logger.setContext(ObjectRepository.name);
  }

  /**
   * Get an iterable stream of active STIX objects from a specific collection.
   * Objects are returned in ascending order by creation date per TAXII spec.
   *
   * @param collectionId TAXII/STIX ID of the collection
   * @returns AsyncIterableIterator of AttackObjectEntity
   */
  async *findByCollectionId(collectionId: string): AsyncIterableIterator<AttackObjectEntity> {
    const cursor = this.attackObjectsModel
      .find({
        '_meta.collectionRef.id': collectionId,
        '_meta.active': true,
      })
      .sort({ '_meta.createdAt': 1 }) // Uses taxii_object_sorting index
      .cursor();

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      yield doc;
    }

    this.logger.debug(`Finished streaming collection ${collectionId} from database`);
  }

  /**
   * Get all versions of a STIX object from a specific collection.
   *
   * @param collectionId TAXII/STIX ID of the collection
   * @param objectId STIX ID of the requested object
   * @returns Promise resolving to array of matching objects (for version history support)
   * @throws TaxiiNotFoundException if no matching objects are found
   */
  async findOne(collectionId: string, objectId: string): Promise<AttackObjectEntity[]> {
    // Uses taxii_object_lookup index
    const attackObjects: AttackObjectEntity[] = await this.attackObjectsModel
      .find({
        '_meta.collectionRef.id': collectionId,
        'stix.id': objectId,
      })
      .sort({ '_meta.createdAt': 1 })
      .exec();

    if (attackObjects.length === 0) {
      throw new TaxiiNotFoundException({
        title: 'No Objects Found',
        description: `No objects found with ID '${objectId}' in collection '${collectionId}'`,
      });
    }

    return attackObjects;
  }
}
