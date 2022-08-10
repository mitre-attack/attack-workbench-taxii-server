import { Inject, Logger, LoggerService } from "@nestjs/common";
import { STIX_REPO_TOKEN } from "src/stix/constants";
import { StixRepositoryAbstract } from "src/stix/providers/stix.repository.abstract";
import { StixObject, StixObjectDocument } from "./schema/object.schema";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { StixObjectInterface } from "../../../stix/dto/interfaces/stix-object.interface";
import { WorkbenchStixObjectDto } from "../../../stix/providers/workbench/dto/workbench-stix-object.dto";
import { TaxiiCollection, TaxiiCollectionDocument } from "../collection/schema";

export class ObjectCronService {
  private readonly logger: LoggerService = new Logger(ObjectCronService.name);
  constructor(
    @Inject(STIX_REPO_TOKEN) private readonly stixRepo: StixRepositoryAbstract,
    @InjectModel(StixObject.name)
    private stixObjectModel: Model<StixObjectDocument>,
    @InjectModel(TaxiiCollection.name)
    private collectionModel: Model<TaxiiCollectionDocument>
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async primeTheDatabase() {
    /**
     * 1. Get all objects
     * 2. Push each object to its respective collection
     */
    const allAttackObjects: StixObjectInterface[] =
      await this.stixRepo.getAllStixObjects(false);

    allAttackObjects.forEach((object: WorkbenchStixObjectDto) => {});
  }
}
