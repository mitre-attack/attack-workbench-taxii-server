import { Injectable } from "@nestjs/common";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { TaxiiCollectionDto, TaxiiCollectionsDto } from "./dto";
import { InjectModel } from "@nestjs/mongoose";
import { TaxiiCollection, TaxiiCollectionDocument } from "./schema";
import { Model } from "mongoose";
import { WorkbenchRepository } from "src/stix/providers/workbench/workbench.repository";

@Injectable()
export class CollectionRepository {
  /**
   * Instantiates an instance of the CollectionRepository service class
   * @param logger
   * @param stixRepo
   * @param collectionModel
   */
  constructor(
    private readonly logger: Logger,
    private readonly stixRepo: WorkbenchRepository,
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
    try {
      this.logger.log(
        "Attempting to retrieve TAXII collection from the database"
      );

      const taxiiCollection: TaxiiCollectionDto =
        await this.collectionModel.findOne({ id: id });

      if (taxiiCollection) {
        this.logger.log(
          `Located TAXII collection ${id}`,
          this.constructor.name
        );

        return taxiiCollection;
      }
    } catch (e) {
      // Just log the error and carry on.
      this.logger.error(e);
    }
    // // Retrieve the STIX collection directly from the STIX repository (Workbench)
    // const collections: StixObjectInterface[] =
    //   await this.stixRepo.getCollections(id);
    //
    // // Assume only one object in array. (There should only be one element in the array anyways). Transform object
    // // from STIX to TAXII, then return it.
    // // return new TaxiiCollectionDto(collections[0].stix);
    // const collectionDto = new TaxiiCollectionDto(collections[0].stix);
    // try {
    //   // Store the TAXII collection in the database
    //   const model = new this.collectionModel(collectionDto);
    //   await model.save();
    // } catch (e) {
    //   // handle DB exception
    //   this.logger.error(e);
    // }
    // return collectionDto;
  }

  /**
   * Get a summary of all STIX collections
   */
  async findAll(): Promise<TaxiiCollectionsDto> {
    // This object will be returned after we push collections onto it
    const taxiiCollections: TaxiiCollectionsDto = new TaxiiCollectionsDto();

    // First try to get the collections from the DB
    try {
      this.logger.log(
        "Attempting to retrieve all TAXII collections from the database"
      );
      taxiiCollections.collections = await this.collectionModel.find({});
      if (taxiiCollections.collections.length >= 1) {
        return taxiiCollections;
      }
    } catch (e) {
      // handle I/O exceptions thrown by Mongoose
      this.logger.error(
        "An issue occurred while retrieving TAXII collections from the database"
      );
      this.logger.error(e);
    }

    // // If the collections are not present in the DB, then fallback to retrieving them directly
    // // from the STIX repository (Workbench)
    // const stixCollections: StixObjectInterface[] =
    //   await this.stixRepo.getCollections();
    //
    // // Transform STIX to TAXII
    // // const taxiiCollections = new TaxiiCollectionsDto();
    // for (const stixCollection of stixCollections) {
    //   // Transform the collection into a TAXII-compliant collection object
    //   const taxiiCollection = new TaxiiCollectionDto(stixCollection.stix);
    //   taxiiCollections.push(taxiiCollection);
    //
    //   // Push the TAXII collection to the database
    //   try {
    //     this.logger.debug(
    //       `Pushing TAXII collection ${stixCollection.stix.id} to the database`
    //     );
    //     const model = new this.collectionModel(taxiiCollection);
    //     await model.save();
    //   } catch (e) {
    //     // Handle I/O exceptions thrown by Mongoose
    //     this.logger.error(
    //       `An issue occurred while writing TAXII collection ${stixCollection.stix.id} to the database`
    //     );
    //     this.logger.error(e);
    //   }
    // }

    // return taxiiCollections;
  }
}
