import { Injectable } from "@nestjs/common";
import { StixRepositoryAbstract } from "../stix.repository.abstract";
import { StixRepositoryInterface } from "../stix.repository.interface";
import { WorkbenchCollectionBundleDto } from "../workbench/dto/workbench-collection-bundle.dto";
import fs from "fs";

@Injectable()
export class FileRepository
  extends StixRepositoryAbstract
  implements StixRepositoryInterface
{
  enterprise_collection: WorkbenchCollectionBundleDto;
  mobile_collection: WorkbenchCollectionBundleDto;
  ics_collection: WorkbenchCollectionBundleDto;

  constructor() {
    super();

    fs.readFile("data/enterprise-attack.json", (err, data) => {
      if (err) throw err;
      this.enterprise_collection = JSON.parse(data.toString());
    });

    fs.readFile("data/ics-attack.json", (err, data) => {
      if (err) throw err;
      this.ics_collection = JSON.parse(data.toString());
    });

    fs.readFile("data/mobile-attack.json", (err, data) => {
      if (err) throw err;
      this.mobile_collection = JSON.parse(data.toString());
    });
  }

  // getAllStixObjects() {}

  // getAnObject(collectionId: string, stixId: string, versions: boolean) {}

  // getCollectionBundle(collectionId: string) {}

  // getCollections(collectionId?: string) {}
}
