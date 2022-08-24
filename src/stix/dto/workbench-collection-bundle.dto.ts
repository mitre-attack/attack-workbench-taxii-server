import { StixObjectDto } from "./stix-object.dto";
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
  @Type(() => StixObjectDto)
  objects?: StixObjectDto[];
}
