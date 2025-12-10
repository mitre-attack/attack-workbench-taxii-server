import { Expose, Type } from 'class-transformer';

export interface WorkbenchCollectionStixProperties {
  modified: string;
  name: string;
  description?: string;

  x_mitre_contents?: any[];
  x_mitre_version: string;
  x_mitre_attack_spec_version: string;
  type: string;
  spec_version: string;
  id: string;
  created: string;
  created_by_ref: string;
  object_marking_refs?: string[];
  x_mitre_domains?: string[];

  external_references?: any[];
}

export class WorkbenchCollectionDto {
  @Expose()
  @Type(() => Object)
  readonly stix: WorkbenchCollectionStixProperties;

  constructor(stix: WorkbenchCollectionStixProperties) {
    this.stix = stix;
  }
}
