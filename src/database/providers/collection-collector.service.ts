import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectModel } from "@nestjs/mongoose";
import { Logger } from "@nestjs/common";
import { LoggerService } from "@nestjs/common/services/logger.service";
import { FilterQuery, Model } from "mongoose";
import { StixObjectInterface } from "src/stix/interfaces/stix-object.interface";
import { TaxiiCollection, TaxiiCollectionDocument } from "src/database/schema";
import { TaxiiCollectionDto } from "src/taxii/providers/collection/dto";
// import { WorkbenchRepository } from "../workbench/workbench.repository";
import { STIX_REPO_TOKEN } from "../../stix/constants";
import { StixRepositoryInterface } from "../../stix/providers/stix.repository.interface";
import { GET_STIX_COLLECTIONS_JOB_TOKEN } from "../constants";

// function sleep(ms) {
//   return new Promise((resolve) => {
//     setTimeout(resolve, ms);
//   });
// }

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
    // console.time("hydrateObjects");
    this.logger.debug("Starting database collection hydration");

    // If the collections are not present in the DB, then fallback to retrieving them directly
    // from the STIX repository (Workbench)
    const stixCollections: StixObjectInterface[] =
      await this.stixRepo.getCollections();
    //   [
    //       {"stix": {"id": '1', "type": 'typeA', "created": new Date(), "modified": new Date()}},
    //       {"stix": {"id": '2', "type": 'typeB', "created": new Date(), "modified": new Date()}},
    //   ]
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
        // const model = new this.collectionModel(taxiiCollection);
        // await model.save();
      } catch (e) {
        // Handle I/O exceptions thrown by Mongoose
        this.logger.error(
          `An issue occurred while writing TAXII collection ${stixCollection.stix.id} to the database`
        );
        this.logger.error(e);
      }
    }
    // console.timeEnd("hydrateObjects");
  }
}
