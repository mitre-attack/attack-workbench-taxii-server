import { StixObjectInterface } from "src/stix/dto/interfaces/stix-object.interface";
import { WorkbenchStixObjectPropertiesDto } from "./workbench-stix-object-properties.dto";
import { Expose, Type } from "class-transformer";

export class WorkbenchStixObjectDto implements StixObjectInterface {
  @Expose()
  @Type(() => WorkbenchStixObjectPropertiesDto)
  stix: WorkbenchStixObjectPropertiesDto;
  workspace: WorkbenchWorkspace;
}

class WorkbenchWorkspace {
  collections: WorkbenchCollectionIdentity[];
}

class WorkbenchCollectionIdentity {
  collection_ref: string;
  collection_modified: string;
}
