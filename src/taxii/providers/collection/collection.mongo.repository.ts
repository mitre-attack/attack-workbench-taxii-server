import { Injectable } from "@nestjs/common";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { TaxiiCollectionDto, TaxiiCollectionsDto } from "./dto";
import { InjectModel } from "@nestjs/mongoose";
import { TaxiiCollection, TaxiiCollectionDocument } from "src/database/schema";
import { Model } from "mongoose";

@Injectable()
export class CollectionRepository {
  /**
   * Instantiates an instance of the CollectionRepository service class
   * @param logger
   * @param collectionModel
   */
  constructor(
    private readonly logger: Logger,
    @InjectModel(TaxiiCollection.name)
    private collectionModel: Model<TaxiiCollectionDocument>
  ) {
    this.logger.setContext(CollectionRepository.name);
  }

  /**
   * Get a summary of one STIX collection-_dto
   * @param id The unique identifier of a STIX collection-_dto
   */
  async findOne(id: string): Promise<TaxiiCollectionDto> {
    // Retrieve the TAXII collection resource from the database
    const response: TaxiiCollection = await this.collectionModel
      .findOne({ id: id })
      .exec();
    // Transform the response object to a TAXII-compliant DTO and return
    return new TaxiiCollectionDto({ ...response["_doc"] });
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
      this.logger.debug(`element=${JSON.stringify(element, null, 4)}`);
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
