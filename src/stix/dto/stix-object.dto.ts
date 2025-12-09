import { Expose } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsNumber, IsString, IsUUID } from 'class-validator';
import { StixObjectPropertiesInterface } from 'src/stix/interfaces/stix-object-properties.interface';
import { StixGranularMarkingDto } from './stix-granular-marking.dto';
import { StixExternalReferencesDto } from 'src/stix/dto/stix-external-references.dto';

export class StixObjectDto implements StixObjectPropertiesInterface {
  constructor(partial: Partial<Record<string, unknown>>) {
    Object.assign(this, partial);
  }

  // ** Common STIX properties ** //
  // [3.2 Common Properties](https://docs.oasis-open.org/cti/stix/v2.1/csprd01/stix-v2.1-csprd01.html#_Toc16070605)
  @Expose() @IsUUID() id: string;
  @Expose() @IsString() type: string;
  @Expose() @IsString() name?: string;
  @Expose() @IsDate() created: Date;
  @Expose() @IsString() description?: string;
  @Expose() @IsString() spec_version?: string;
  @Expose() @IsUUID() create_by_ref?: string;
  @Expose() @IsDate() modified: Date;
  @Expose() @IsBoolean() revoked?: boolean;
  @Expose() @IsArray() labels?: string[];
  @Expose() @IsNumber() confidence?: number;
  @Expose() @IsString() lang?: string;
  @Expose() @IsArray() external_references?: StixExternalReferencesDto[];
  @Expose() @IsArray() object_marking_refs?: string[];
  @Expose() @IsArray() granular_markings?: StixGranularMarkingDto[];
  @Expose() @IsBoolean() defanged?: boolean;

  // STIX 2.1 object extensions
  @Expose() extensions?: Record<string, unknown>;

  // ** MITRE ATTACK non-standard properties ** //
  @Expose() x_mitre_platforms?: string[];
  @Expose() x_mitre_domains?: string[];
  @Expose() x_mitre_contributors?: string[];
  @Expose() x_mitre_data_sources?: string[];
  @Expose() x_mitre_version?: string;
  @Expose() x_mitre_permissions_required?: string[];
  @Expose() x_mitre_is_subtechnique?: boolean;
  @Expose() x_mitre_detection?: string;
  @Expose() x_mitre_modified_by_ref?: string;
}
