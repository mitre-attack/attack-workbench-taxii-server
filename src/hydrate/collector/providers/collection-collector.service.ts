import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectModel } from "@nestjs/mongoose";
import { Logger } from "@nestjs/common";
import { LoggerService } from "@nestjs/common/services/logger.service";
import { FilterQuery, Model } from "mongoose";
import { StixObjectInterface } from "src/stix/interfaces/stix-object.interface";
import {
  TaxiiCollection,
  TaxiiCollectionDocument,
} from "src/hydrate/collector/schema";
import { TaxiiCollectionDto } from "src/taxii/providers/collection/dto";
import { STIX_REPO_TOKEN } from "src/stix/constants";
import { StixRepositoryInterface } from "src/stix/providers/stix.repository.interface";
import { GET_STIX_COLLECTIONS_JOB_TOKEN } from "../constants";

@Injectable()
export class CollectionCollectorService {
  private readonly logger: LoggerService = new Logger(
    CollectionCollectorService.name
  );

  constructor(
    @Inject(STIX_REPO_TOKEN) private stixRepo: StixRepositoryInterface,
    @InjectModel(TaxiiCollection.name)
    private collectionModel: Model<TaxiiCollectionDocument>
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES, {
    name: GET_STIX_COLLECTIONS_JOB_TOKEN,
  })
  async findAndStoreStixCollections(): Promise<void> {
    this.logger.debug("Starting database collection hydration");

    // If the collections are not present in the DB, then fallback to retrieving them directly
    // from the STIX repository (Workbench)
    const stixCollections: StixObjectInterface[] =
      await this.stixRepo.getCollections();

    this.logger.debug(
      "Successfully retrieved STIX collections from the STIX repository"
    );

    // Transform STIX to TAXII
    for (const stixCollection of stixCollections) {
      // Transform the collection into a TAXII-compliant collection object
      const taxiiCollection = new TaxiiCollectionDto(stixCollection.stix);

      // Push the TAXII collection to the database
      try {
        this.logger.debug(
          `Pushing TAXII collection ${stixCollection.stix.id} to the database`
        );
        const filter: FilterQuery<TaxiiCollection> = {
          id: { $eq: taxiiCollection.id },
        };
        await this.collectionModel
          .updateOne(filter, taxiiCollection, {
            upsert: true,
            strict: true,
          })
          .exec();
        this.logger.debug(
          `Synchronized STIX collection '${taxiiCollection.id}' to TAXII database`
        );
      } catch (e) {
        // Handle I/O exceptions thrown by Mongoose
        this.logger.error(
          `An issue occurred while writing TAXII collection ${stixCollection.stix.id} to the database`
        );
        this.logger.error(e);
      }
    }
  }
}
