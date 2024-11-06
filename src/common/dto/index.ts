import { z } from "zod";
import { createZodDto } from "nestjs-zod";
import {
    attackObjectsSchema,    // union of all ATT&CK objects
    attackBaseObjectSchema, // least common denominator STIX+ATT&CK properties
    stixBundleSchema
} from "@mitre-attack/attack-data-model";


// TODO replaces WorkbenchCollectionBundleDto
// TODO delete old WorkbenchCollectionBundleDto (src/stix/dto/workbench-collection-bundle.dto)
// TODO delete StixBundleInterface (src/stix/interfaces/stix-bundle.interface)
export class StixBundleDto extends createZodDto(stixBundleSchema) { };



// TODO replaces StixObjectPropertiesInterface
// StixObjectPropertiesInterface used to define all of the allowed STIX+ATT&CK properties
// attackBaseObjectSchema already does this, so we generate a DTO from it
export class StixObjectPropertiesDto extends createZodDto(attackBaseObjectSchema) { }

// TODO replaces WorkbenchWorkspace and WorkbenchCollectionIdentity (src/stix/dto/attack-object.dto)
const workbenchWorkspaceSchema = z.object({
    collections: z.array(
        z.object({
            collection_ref: z.string(),
            collection_modified: z.string()
        })
    ),
    attack_id: z.string().optional()
});

// this one is just a wrapper for objects embedded in a 'stix' key in a JSON object
// e.g. { stix: { ...anyAttackObject }}
const stixPropsSchema = z.object({
    stix: attackObjectsSchema,
    workspace: workbenchWorkspaceSchema.optional()
});
// TODO replaces StixObjectInterface
export class StixPropsDto extends createZodDto(stixPropsSchema) { }





// TODO replaces StixObjectDto (name does not change)
export class StixObjectDto extends createZodDto(attackObjectsSchema) { }


