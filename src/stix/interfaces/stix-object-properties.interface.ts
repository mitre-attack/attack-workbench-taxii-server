import { StixExternalReferencesDto } from "../dto/stix-external-references.dto";
import { StixGranularMarkingDto } from "../dto/stix-granular-marking.dto";

export interface StixObjectPropertiesInterface {
  // ** Common STIX properties ** //
  // [3.2 Common Properties](https://docs.oasis-open.org/cti/stix/v2.1/csprd01/stix-v2.1-csprd01.html#_Toc16070605)
  id: string;
  type: string;
  spec_version?: string;
  create_by_ref?: string;
  created: Date;
  modified: Date;
  revoked?: boolean;
  labels?: Array<string>;
  confidence?: number;
  lang?: string;
  external_references?: Array<StixExternalReferencesDto>;
  object_marking_refs?: Array<string>;
  granular_markings?: Array<StixGranularMarkingDto>;
  defanged?: boolean;

  // STIX 2.1 object extensions
  extensions?: Object;

  // ** MITRE ATTACK non-standard properties ** //
  x_mitre_platforms?: Array<any>;
  x_mitre_domains?: Array<string>;
  x_mitre_contributors?: Array<string>;
  x_mitre_data_sources?: Array<string>;
  x_mitre_version?: string;
  x_mitre_permissions_required?: Array<string>;
  x_mitre_is_subtechnique?: boolean;
  x_mitre_detection?: string;
  x_mitre_modified_by_ref?: string;
}
