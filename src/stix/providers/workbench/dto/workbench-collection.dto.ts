import {WorkbenchStixObjectPropertiesDto} from "./workbench-stix-object-properties.dto";
import {Expose, Type} from "class-transformer";
import {StixObjectInterface} from "src/stix/dto/interfaces/stix-object.interface";

export class WorkbenchCollectionDto implements StixObjectInterface {

    // The commented-out properties will also be returned from Workbench (GET /api/collection) requests, but will be
    // dropped because they serve no practical purpose to the TAXII server. They are dropped by virtue of the
    // excludeExtraneousValues option set to true in the plainToInstance method calls within WorkbenchRepository.

    // _id: uuid  <--- WILL BE DROPPED
    // workspace: { ... }  <--- WILL BE DROPPED
    @Expose() @Type(() => WorkbenchStixObjectPropertiesDto) stix: WorkbenchStixObjectPropertiesDto;
    // __t: "Collection";  <--- WILL BE DROPPED
    // __v: number;  <--- WILL BE DROPPED
    // created_by_identity: { ... }  <--- WILL BE DROPPED

    constructor(partial: Partial<WorkbenchCollectionDto>) {
        Object.assign(this, partial);
    }
}