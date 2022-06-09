export class StixExternalReferencesDto {
    source_name: string;
    description?: string;
    url?: string;
    hashes?: string;
    external_id?: string;

    constructor(partial?: Partial<any>) {
        Object.assign(this, partial);
    }
}