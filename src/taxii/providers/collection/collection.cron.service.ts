import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectModel } from "@nestjs/mongoose";
import { Logger } from "@nestjs/common";
import { LoggerService } from "@nestjs/common/services/logger.service";
import { Model } from "mongoose";
import { STIX_REPO_TOKEN } from "src/stix/constants";
import { StixRepositoryAbstract } from "src/stix/providers/stix.repository.abstract";
import { StixObjectInterface } from "src/stix/dto/interfaces/stix-object.interface";
import { TaxiiCollection, TaxiiCollectionDocument } from "./schema";
import { TaxiiCollectionDto } from "./dto";

@Injectable()
export class CollectionCronService {
  private readonly logger: LoggerService = new Logger(
    CollectionCronService.name
  );

  constructor(
    @Inject(STIX_REPO_TOKEN) private readonly stixRepo: StixRepositoryAbstract,
    @InjectModel(TaxiiCollection.name)
    private collectionModel: Model<TaxiiCollectionDocument>
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async primeTheDatabase(): Promise<void> {
    this.logger.debug(
      "Start job to populate the 'taxiicollections' database collection"
    );

    // If the collections are not present in the DB, then fallback to retrieving them directly
    // from the STIX repository (Workbench)
    const stixCollections: StixObjectInterface[] =
      await this.stixRepo.getCollections();

    this.logger.debug(
      "Successfully retrieved STIX collections from the STIX repository"
    );

    // Transform STIX to TAXII
    // const taxiiCollections = new TaxiiCollectionsDto();
    for (const stixCollection of stixCollections) {
      // Transform the collection into a TAXII-compliant collection object
      const taxiiCollection = new TaxiiCollectionDto(stixCollection.stix);

      // Push the TAXII collection to the database
      try {
        this.logger.debug(
          `Pushing TAXII collection ${stixCollection.stix.id} to the database`
        );
        const model = new this.collectionModel(taxiiCollection);
        await model.save();
      } catch (e) {
        // Handle I/O exceptions thrown by Mongoose
        this.logger.error(
          `An issue occurred while writing TAXII collection ${stixCollection.stix.id} to the database`
        );
        this.logger.error(e);
      }
    }
    this.logger.debug(
      "Completed job to populate the 'taxiicollections' database collection"
    );
  }
}
