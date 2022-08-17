import { Inject, Injectable } from "@nestjs/common";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { TaxiiCollectionDto, TaxiiCollectionsDto } from "./dto";
// import { WorkbenchRepository } from "src/stix/providers/workbench/workbench.repository";
import { StixObjectInterface } from "src/stix/interfaces/stix-object.interface";
import { STIX_REPO_TOKEN } from "../../../stix/constants";
import { StixRepositoryInterface } from "../../../stix/providers/stix.repository.interface";

@Injectable()
export class CollectionWorkbenchRepository {
  /**
   * Instantiates an instance of the CollectionRepository service class
   * @param logger
   * @param stixRepo
   */
  constructor(
    private readonly logger: Logger,
    @Inject(STIX_REPO_TOKEN) private readonly stixRepo: StixRepositoryInterface
  ) {
    this.logger.setContext(CollectionWorkbenchRepository.name);
  }

  /**
   * Get a summary of one STIX collection-_dto
   * @param id The unique identifier of a STIX collection-_dto
   */
  async findOne(id: string): Promise<TaxiiCollectionDto> {
    // Retrieve the STIX collection directly from the STIX repository (Workbench)
    const collections: StixObjectInterface[] =
      await this.stixRepo.getCollections(id);

    // Assume only one object in array. (There should only be one element in the array anyways). Transform object
    // from STIX to TAXII, then return it.
    return new TaxiiCollectionDto(collections[0].stix);
  }

  /**
   * Get a summary of all STIX collections
   */
  async findAll(): Promise<TaxiiCollectionsDto> {
    // This object will be returned after we push collections onto it
    const taxiiCollections: TaxiiCollectionsDto = new TaxiiCollectionsDto();

    // If the collections are not present in the DB, then fallback to retrieving them directly
    // from the STIX repository (Workbench)
    const stixCollections: StixObjectInterface[] =
      await this.stixRepo.getCollections();

    // Transform STIX to TAXII
    // const taxiiCollections = new TaxiiCollectionsDto();
    for (const stixCollection of stixCollections) {
      // Transform the collection into a TAXII-compliant collection object
      const taxiiCollection = new TaxiiCollectionDto(stixCollection.stix);
      taxiiCollections.push(taxiiCollection);
    }
    return taxiiCollections;
  }
}
