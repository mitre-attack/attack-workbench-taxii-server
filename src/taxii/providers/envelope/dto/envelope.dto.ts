import {StixObjectPropertiesInterface} from "src/stix/dto/interfaces/stix-object-properties.interface";
import {SinglePageInterface} from "src/taxii/providers/pagination/interfaces/single-page.interface";
import {Exclude, Expose, Type} from "class-transformer";
import {IsBoolean, IsOptional, IsString} from "class-validator";
import {WorkbenchStixObjectPropertiesDto} from "src/stix/providers/workbench/dto/workbench-stix-object-properties.dto";
import {GenericPageDto, GenericPageOptions} from "../../pagination/dto/generic-page.dto";

export interface EnvelopeConstructorOptions extends GenericPageOptions<StixObjectPropertiesInterface> {
    id?: string;      // <-- INHERITED
    more?: boolean;   // <-- INHERITED
    next?: string;    // <-- INHERITED
    items?: StixObjectPropertiesInterface[];
}

@Exclude()
export class EnvelopeDto extends GenericPageDto implements SinglePageInterface<StixObjectPropertiesInterface>{

    @Exclude()
    id: string;

    @Expose()
    @IsOptional()
    @IsBoolean()
    more: boolean;

    @Expose()
    @IsString()
    @IsOptional()
    next: string;

    @IsOptional()
    @Type(() => WorkbenchStixObjectPropertiesDto)
    @Expose({ name: "objects" })
    items: StixObjectPropertiesInterface[];

    constructor (options: EnvelopeConstructorOptions) {
        super(options);
    }

}