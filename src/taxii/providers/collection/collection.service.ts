import { Injectable } from "@nestjs/common";
import { CollectionRepository } from "./collection.repository";
import { TaxiiCollectionDto, TaxiiCollectionsDto } from "./dto";
import { TaxiiNotFoundException } from "src/common/exceptions";
import { TaxiiLoggerService as Logger } from "src/common/logger";

@Injectable()
export class CollectionService {
  constructor(
    private readonly logger: Logger,
    private readonly stixCollectionsRepo: CollectionRepository
  ) {
    this.logger.setContext(CollectionService.name);
  }

  /**
   * Gets a list of all available TaxiiCollectionDto objects
   */
  async findAll(): Promise<TaxiiCollectionsDto> {
    // Fetch all STIX collection-_dto from the Workbench REST API and deserialize into JSON
    const taxiiCollections: TaxiiCollectionsDto =
      await this.stixCollectionsRepo.findAll();

    if (!taxiiCollections) {
      throw new TaxiiNotFoundException({
        title: "Stix Collections Not Found",
        description:
          "The STIX Collections Repo did not return any collection objects. Ensure that STIX data exists in the stix.",
      });
    }

    this.logger.debug(
      `Retrieved ${taxiiCollections.length} STIX Collections from the repository`,
      this.constructor.name
    );

    return taxiiCollections;
  }

  /**
   * Gets one Collection object
   * @param id The unique STIX ID (workbench.id) of the target STIX collection object
   */
  async findOne(id: string): Promise<TaxiiCollectionDto> {
    const taxiiCollection: TaxiiCollectionDto =
      await this.stixCollectionsRepo.findOne(id);

    if (!taxiiCollection) {
      throw new TaxiiNotFoundException({
        title: "No STIX Collection Found",
        description: `No STIX Collection with the ID ${id} was found.`,
      });
    }

    this.logger.debug(
      `Retrieved STIX Collection ${taxiiCollection.id} from the repository`,
      this.constructor.name
    );

    return taxiiCollection;
  }
}
