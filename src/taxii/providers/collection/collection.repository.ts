import { Inject, Injectable } from "@nestjs/common";
import { StixObjectInterface } from "src/stix/dto/interfaces/stix-object.interface";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { STIX_REPO_TOKEN } from "src/stix/constants";
import { StixRepositoryAbstract } from "src/stix/providers/stix.repository.abstract";
import { TaxiiCollectionDto, TaxiiCollectionsDto } from "./dto";

@Injectable()
export class CollectionRepository {
  /**
   * Instantiates an instance of the CollectionRepository service class
   * @param logger
   * @param stixRepo
   */
  constructor(
    private readonly logger: Logger,
    @Inject(STIX_REPO_TOKEN) private readonly stixRepo: StixRepositoryAbstract
  ) {
    logger.setContext(CollectionRepository.name);
  }

  /**
   * Get a summary of one STIX collection-_dto
   * @param id The unique identifier of a STIX collection-_dto
   */
  async findOne(id: string): Promise<TaxiiCollectionDto> {
    // The async function should return an array of (hopefully) one STIX collection.
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
    const stixCollections: StixObjectInterface[] =
      await this.stixRepo.getCollections();

    // Transform STIX to TAXII
    const taxiiCollections = new TaxiiCollectionsDto();
    stixCollections.forEach((stixCollection) => {
      const taxiiCollection = new TaxiiCollectionDto(stixCollection.stix);
      taxiiCollections.push(taxiiCollection);
    });

    return taxiiCollections;
  }
}
