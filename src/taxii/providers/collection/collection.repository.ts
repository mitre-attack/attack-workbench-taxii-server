import { Injectable } from "@nestjs/common";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { TaxiiCollectionDto, TaxiiCollectionsDto } from "./dto";
import { InjectModel } from "@nestjs/mongoose";
import {
  TaxiiCollectionEntity,
  TaxiiCollectionDocument,
} from "src/hydrate/schema";
import { Model } from "mongoose";
import { isNull } from "lodash";

@Injectable()
export class CollectionRepository {
  /**
   * Instantiates an instance of the CollectionRepository service class
   * @param logger
   * @param collectionModel
   */
  constructor(
    private readonly logger: Logger,
    @InjectModel(TaxiiCollectionEntity.name)
    private collectionModel: Model<TaxiiCollectionDocument>
  ) {
    this.logger.setContext(CollectionRepository.name);
  }

  /**
   * Get a summary of one STIX collection-_dto
   * @param id The unique identifier of a STIX collection-_dto
   */
  async findOne(id: string): Promise<TaxiiCollectionDto> {
    const response: TaxiiCollectionEntity = await this.collectionModel
      .findOne({ id: id })
      .exec();

    return new Promise((resolve, reject) => {
      if (!isNull(response)) {
        // Transform the response object to a TAXII-compliant DTO and return
        resolve(new TaxiiCollectionDto({ ...response["_doc"] }));
      }
      reject(`Collection ID '${id}' not available in database`);
    });
  }

  /**
   * Get a summary of all STIX collections
   */
  async findAll(): Promise<TaxiiCollectionsDto> {
    // Initialize the parent resource
    const taxiiCollectionsResource: TaxiiCollectionsDto =
      new TaxiiCollectionsDto();

    // Retrieve the list of TAXII collection resources from the database
    const response: TaxiiCollectionDto[] = await this.collectionModel
      .find({})
      .exec();

    // Transform each collection resource to a TAXII-compliant DTO and push it onto the parent DTO resource
    for (const element of response) {
      taxiiCollectionsResource.collections.push(
        new TaxiiCollectionDto({
          id: element.id,
          canRead: element.canRead,
          canWrite: element.canWrite,
          description: element.description,
          mediaTypes: element.mediaTypes,
          title: element.title,
        })
      );
    }
    return taxiiCollectionsResource;
  }
}
