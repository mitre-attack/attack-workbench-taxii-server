import { Injectable } from '@nestjs/common';
import { TaxiiLoggerService as Logger } from 'src/common/logger';
import { TaxiiCollectionDto, TaxiiCollectionsDto } from './dto';
import { InjectModel } from '@nestjs/mongoose';
import { TaxiiCollectionEntity, TaxiiCollectionDocument } from 'src/hydrate/schema';
import { Model } from 'mongoose';
import { TaxiiNotFoundException } from 'src/common/exceptions';

@Injectable()
export class CollectionRepository {
  constructor(
    private readonly logger: Logger,
    @InjectModel(TaxiiCollectionEntity.name)
    private collectionModel: Model<TaxiiCollectionDocument>,
  ) {
    this.logger.setContext(CollectionRepository.name);
  }

  /**
   * Get a specific active TAXII collection by ID.
   *
   * @param id TAXII/STIX ID of the collection
   * @returns Promise resolving to TaxiiCollectionDto
   * @throws TaxiiNotFoundException if collection is not found
   */
  async findOne(id: string): Promise<TaxiiCollectionDto> {
    this.logger.debug(`Searching for collection with ID: ${id}`);

    // Uses taxii_collection_lookup index
    const response: TaxiiCollectionEntity = await this.collectionModel
      .findOne({
        id: id,
        '_meta.active': true,
      })
      .exec();

    if (!response) {
      throw new TaxiiNotFoundException({
        title: 'Collection Not Found',
        description: `Collection ID '${id}' not available in database`,
      });
    }

    return new TaxiiCollectionDto({ ...response['_doc'] });
  }

  /**
   * Get all active TAXII collections.
   *
   * @returns Promise resolving to TaxiiCollectionsDto containing all active collections
   */
  async findAll(): Promise<TaxiiCollectionsDto> {
    const taxiiCollectionsResource = new TaxiiCollectionsDto();

    // Only return active collections
    const response: TaxiiCollectionEntity[] = await this.collectionModel
      .find({ '_meta.active': true })
      .exec();

    // Transform to TAXII-compliant DTOs
    for (const element of response) {
      taxiiCollectionsResource.collections.push(
        new TaxiiCollectionDto({
          id: element.id,
          canRead: element.canRead,
          canWrite: element.canWrite,
          description: element.description,
          mediaTypes: element.mediaTypes,
          title: element.title,
        }),
      );
    }
    return taxiiCollectionsResource;
  }
}
