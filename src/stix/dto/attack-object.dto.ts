import { StixObjectInterface } from "src/stix/interfaces/stix-object.interface";
import { StixObjectDto } from "./stix-object.dto";
import { Expose, Type } from "class-transformer";

export class AttackObjectDto implements StixObjectInterface {
  @Expose()
  @Type(() => StixObjectDto)
  stix: StixObjectDto;

  workspace: WorkbenchWorkspace;
}

class WorkbenchWorkspace {
  collections: WorkbenchCollectionIdentity[];
  attack_id?: string;
}

class WorkbenchCollectionIdentity {
  collection_ref: string;
  collection_modified: string;
}
