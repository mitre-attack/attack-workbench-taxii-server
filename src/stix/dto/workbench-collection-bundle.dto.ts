// TODO annotate with Stix Bundle Object documentation
// https://docs.oasis-open.org/cti/stix/v2.1/csprd01/stix-v2.1-csprd01.html#_Toc16070770
import { WorkbenchStixObjectPropertiesDto } from "./workbench-stix-object-properties.dto";
import { Expose, Type } from "class-transformer";
import { StixBundleInterface } from "src/stix/interfaces/stix-bundle.interface";
import { IsString } from "class-validator";

export class WorkbenchCollectionBundleDto implements StixBundleInterface {
  @Expose()
  @IsString()
  type: string;

  @Expose()
  @IsString()
  id: string;

  @Expose()
  @Type(() => WorkbenchStixObjectPropertiesDto)
  objects?: WorkbenchStixObjectPropertiesDto[];
}
