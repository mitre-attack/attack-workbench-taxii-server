import { Injectable } from '@nestjs/common';
import { TaxiiLoggerService as Logger } from 'src/common/logger';
import { TaxiiCollectionDto, TaxiiCollectionsDto } from './dto';
import { InjectModel } from '@nestjs/mongoose';
import { TaxiiCollectionEntity, TaxiiCollectionDocument } from 'src/hydrate/schema';
import { Model } from 'mongoose';
import { TaxiiNotFoundException } from 'src/common/exceptions';
import { ReleaseService } from '../release';

@Injectable()
export class CollectionRepository {
  constructor(
    private readonly logger: Logger,
    @InjectModel(TaxiiCollectionEntity.name)
    private collectionModel: Model<TaxiiCollectionDocument>,
    private readonly releaseService: ReleaseService,
  ) {
    this.logger.setContext(CollectionRepository.name);
  }

  private toDto(entity: TaxiiCollectionEntity): TaxiiCollectionDto {
    return new TaxiiCollectionDto({
      id: entity.id,
      title: entity.title,
      description: entity.description,
      alias: entity.alias,
      canRead: entity.canRead,
      canWrite: entity.canWrite,
      mediaTypes: entity.mediaTypes,
    });
  }

  /**
   * Get a specific TAXII collection by ID, scoped to a single ATT&CK release.
   *
   * @param id TAXII/STIX ID of the collection
   * @param release The ATT&CK release version (e.g. "19.1") the request is scoped to. Undefined
   *                means the default (latest-tracking) API root; the collection's latest release
   *                is resolved through its latest-release pointer.
   * @returns Promise resolving to TaxiiCollectionDto
   * @throws TaxiiNotFoundException if collection is not found
   */
  async findOne(id: string, release?: string): Promise<TaxiiCollectionDto> {
    const version = release ?? (await this.releaseService.resolveLatestVersion(id));

    this.logger.debug(`Searching for collection with ID: ${id} (release ${version})`);

    // Uses taxii_collection_release_lookup index
    const response: TaxiiCollectionEntity = await this.collectionModel
      .findOne({
        id: id,
        '_meta.release.version': version,
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
   * Get all TAXII collections available on a single API root.
   *
   * @param release The ATT&CK release version the request is scoped to. Undefined means the
   *                default (latest-tracking) API root: each collection is listed at the release
   *                its latest-release pointer designates.
   * @returns Promise resolving to TaxiiCollectionsDto
   */
  async findAll(release?: string): Promise<TaxiiCollectionsDto> {
    const taxiiCollectionsResource = new TaxiiCollectionsDto();

    let response: TaxiiCollectionEntity[];
    if (release) {
      response = await this.collectionModel.find({ '_meta.release.version': release }).exec();
    } else {
      const pointers = await this.releaseService.getLatestPointers();
      if (pointers.length === 0) {
        return taxiiCollectionsResource;
      }
      response = await this.collectionModel
        .find({
          $or: pointers.map((pointer) => ({
            id: pointer.collectionId,
            '_meta.release.version': pointer.version,
          })),
        })
        .exec();
    }

    // Transform to TAXII-compliant DTOs
    for (const element of response) {
      taxiiCollectionsResource.collections.push(this.toDto(element));
    }
    return taxiiCollectionsResource;
  }
}
