// object.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TaxiiNotFoundException } from 'src/common/exceptions';
import { TaxiiLoggerService as Logger } from 'src/common/logger';
import { AttackObjectDocument, AttackObjectEntity } from 'src/hydrate/schema/attack-object.schema';

export interface FindByCollectionIdOptions {
  latestOnly?: boolean;
}

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
   * Get an iterable stream of STIX objects from a single release of a specific collection.
   * Objects are returned in ascending order by creation date per TAXII spec.
   *
   * @param collectionId TAXII/STIX ID of the collection
   * @param release The ATT&CK release version (e.g. "19.1") the request is scoped to. Always
   *                resolved by the service layer before reaching the repository (either from the
   *                pinned API root the request arrived on, or from the collection's latest-release
   *                pointer for the default API root).
   * @param options.latestOnly When true, stream only the newest version of each STIX object ID
   * @returns AsyncIterableIterator of AttackObjectEntity
   */
  async *findByCollectionId(
    collectionId: string,
    release: string,
    options: FindByCollectionIdOptions = {},
  ): AsyncIterableIterator<AttackObjectEntity> {
    if (options.latestOnly) {
      const cursor = this.attackObjectsModel
        .aggregate([
          {
            $match: {
              '_meta.collectionRef.id': collectionId,
              '_meta.collectionRef.version': release,
            },
          },
          {
            $addFields: {
              _taxiiVersionDate: { $ifNull: ['$stix.modified', '$stix.created'] },
            },
          },
          {
            $sort: {
              'stix.id': 1,
              _taxiiVersionDate: -1,
              '_meta.createdAt': -1,
            },
          },
          { $group: { _id: '$stix.id', document: { $first: '$$ROOT' } } },
          { $replaceRoot: { newRoot: '$document' } },
          { $project: { _taxiiVersionDate: 0 } },
          { $sort: { '_meta.createdAt': 1 } },
        ])
        .allowDiskUse(true)
        .cursor();

      for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        yield this.attackObjectsModel.hydrate(doc);
      }

      this.logger.debug(
        `Finished streaming latest objects of collection ${collectionId} (release ${release}) from database`,
      );
      return;
    }

    const cursor = this.attackObjectsModel
      .find({
        '_meta.collectionRef.id': collectionId,
        '_meta.collectionRef.version': release,
      })
      .sort({ '_meta.createdAt': 1 }) // Uses taxii_objects_by_collection index
      .cursor();

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      yield doc;
    }

    this.logger.debug(
      `Finished streaming collection ${collectionId} (release ${release}) from database`,
    );
  }

  /**
   * Get all versions of a STIX object from a single release of a specific collection.
   *
   * @param collectionId TAXII/STIX ID of the collection
   * @param objectId STIX ID of the requested object
   * @param release The ATT&CK release version the request is scoped to (see findByCollectionId)
   * @returns Promise resolving to array of matching objects (for version history support)
   * @throws TaxiiNotFoundException if no matching objects are found
   */
  async findOne(
    collectionId: string,
    objectId: string,
    release: string,
  ): Promise<AttackObjectEntity[]> {
    // Uses taxii_object_lookup index
    const attackObjects: AttackObjectEntity[] = await this.attackObjectsModel
      .find({
        '_meta.collectionRef.id': collectionId,
        '_meta.collectionRef.version': release,
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
