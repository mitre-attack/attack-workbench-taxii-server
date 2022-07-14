import { Injectable } from "@nestjs/common";
import { StixRepositoryAbstract } from "../stix.repository.abstract";
import { StixRepositoryInterface } from "../stix.repository.interface";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { TaxiiConfigService } from "src/config";
import { WorkbenchCollectionBundleDto } from "../workbench/dto/workbench-collection-bundle.dto";
import fs from "fs";
import { HttpService } from "@nestjs/axios";

@Injectable()
export class GithubRepository
  extends StixRepositoryAbstract
  implements StixRepositoryInterface
{
  enterprise_collection: WorkbenchCollectionBundleDto;
  mobile_collection: WorkbenchCollectionBundleDto;
  ics_collection: WorkbenchCollectionBundleDto;

  constructor(
    private readonly logger: Logger,
    private readonly config: TaxiiConfigService,
    private readonly http: HttpService
  ) {
    super();

    fs.readFile(`${__dirname}/data/enterprise-attack.json`, (err, data) => {
      if (err) throw err;
      this.enterprise_collection = JSON.parse(data.toString());
    });
  }

  getAllStixObjects() {}

  getAnObject(collectionId: string, stixId: string, versions: boolean) {}

  getCollectionBundle(collectionId: string) {}

  getCollections(collectionId?: string) {}
}
