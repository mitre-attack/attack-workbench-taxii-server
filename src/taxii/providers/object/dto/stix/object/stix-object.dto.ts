// import {IdentifierDto} from "src/common/models/identifier";
// import {TimestampDto} from "src/common/models/timestamp";
// import {Type} from "class-transformer";
// import {IsUUID} from "class-validator";
//
// class ExternalReferencesDto {
//     source_name: string;
//     description?: string;
//     url?: string;
//     hashes?: string; // technically this is supposed to be of type 'hashes'
//     external_id?: string;
// }
//
// class GranularMarkingDto {
//     lang?: string;
//     marking_ref?: IdentifierDto;
//     selectors: Array<string>;
// }
//
// export class StixObjectDto {
//     type?: string;
//     spec_version?: string;
//     @IsUUID() id?: string;
//     @Type(() => IdentifierDto) create_by_ref?: IdentifierDto;
//     @Type(() => TimestampDto) created?: TimestampDto;
//     @Type(() => TimestampDto) modified?: TimestampDto;
//     revoked?: boolean;
//     labels?: Array<string>;
//     confidence?: number;
//     lang?: string;
//     @Type(() => ExternalReferencesDto) external_references?: Array<ExternalReferencesDto>;
//     object_marking_refs?: Array<IdentifierDto>;
//     granular_markings?: Array<GranularMarkingDto>;
//     defanged?: boolean;
//     extensions?: Object;
//     x_mitre_platforms?: Array<any>;
//     x_mitre_domains?: Array<string>;
//     x_mitre_contributors?: Array<string>;
//     x_mitre_data_sources?: Array<string>;
//     x_mitre_version?: string;
//     x_mitre_permissions_required?: Array<string>;
//     x_mitre_is_subtechnique?: boolean;
//     x_mitre_detection?: string;
//     x_mitre_modified_by_ref?: string;
//
//     constructor(partial?: Partial<any>) {
//         Object.assign(this, partial);
//     }
// }
