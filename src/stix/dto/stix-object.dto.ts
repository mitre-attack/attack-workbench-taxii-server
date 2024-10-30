import { Expose } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsNumber, IsString, IsUUID } from "class-validator";
import { StixObjectPropertiesInterface } from "src/stix/interfaces/stix-object-properties.interface";
import { StixGranularMarkingDto } from "./stix-granular-marking.dto";
import { StixExternalReferencesDto } from "src/stix/dto/stix-external-references.dto";

export class StixObjectDto implements StixObjectPropertiesInterface {
  constructor(partial: Partial<Record<string, unknown>>) {
    Object.assign(this, partial);
  }

  // ** Common STIX properties ** //
  // [3.2 Common Properties](https://docs.oasis-open.org/cti/stix/v2.1/csprd01/stix-v2.1-csprd01.html#_Toc16070605)
  @Expose() @IsUUID() id: any;
  @Expose() @IsString() type: any;
  @Expose() @IsString() name?: any;
  @Expose() @IsDate() created: Date;
  @Expose() @IsString() description?: any;
  @Expose() @IsString() spec_version?: any;
  @Expose() @IsUUID() create_by_ref?: any;
  @Expose() @IsDate() modified: Date;
  @Expose() @IsBoolean() revoked?: any;
  @Expose() @IsArray() labels?: any;
  @Expose() @IsNumber() confidence?: any;
  @Expose() @IsString() lang?: any;
  @Expose() @IsArray() external_references?: StixExternalReferencesDto[];
  @Expose() @IsArray() object_marking_refs?: any;
  @Expose() @IsArray() granular_markings?: StixGranularMarkingDto[];
  @Expose() @IsBoolean() defanged?: any;

  // STIX 2.1 object extensions
  @Expose() extensions?: any;

  // ** MITRE ATTACK non-standard properties ** //
  @Expose() x_mitre_platforms?: any;
  @Expose() x_mitre_domains?: any;
  @Expose() x_mitre_contributors?: any;
  @Expose() x_mitre_data_sources?: any;
  @Expose() x_mitre_version?: any;
  @Expose() x_mitre_permissions_required?: any;
  @Expose() x_mitre_is_subtechnique?: any;
  @Expose() x_mitre_detection?: any;
  @Expose() x_mitre_modified_by_ref?: any;
}
