import {SinglePageInterface} from "../../pagination/interfaces/single-page.interface";
import {ManifestRecordDto} from "./manifest-record.dto";
import {Exclude, Expose, Type} from "class-transformer";
import {IsBoolean, IsOptional, IsString} from "class-validator";
import {GenericPageDto, GenericPageOptions} from "../../pagination/dto/generic-page.dto";

export interface ManifestConstructorProperties extends GenericPageOptions<ManifestRecordDto> {
    id?: string;      // <-- INHERITED
    more?: boolean;   // <-- INHERITED
    next?: string;    // <-- INHERITED
    items?: ManifestRecordDto[];
}

export class ManifestDto extends GenericPageDto implements SinglePageInterface<ManifestRecordDto>{
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
    @Type(() => ManifestRecordDto)
    @Expose({ name: "objects" })
    items: ManifestRecordDto[];

    constructor (options: ManifestConstructorProperties) {
        super(options);
    }
}