import { StixObjectPropertiesInterface } from "src/stix/interfaces/stix-object-properties.interface";
import { SinglePageInterface } from "src/taxii/providers/pagination/interfaces/single-page.interface";
import { Exclude, Expose, Type } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { StixObjectDto } from "src/stix/dto/stix-object.dto";
import {
  GenericPageDto,
  GenericPageOptions,
} from "../../pagination/dto/generic-page.dto";

export interface EnvelopeConstructorOptions
  extends GenericPageOptions<StixObjectPropertiesInterface> {
  id?: string; // <-- INHERITED
  more?: boolean; // <-- INHERITED
  next?: string; // <-- INHERITED
  objects?: StixObjectPropertiesInterface[];
}

@Exclude()
export class EnvelopeDto
  extends GenericPageDto
  implements SinglePageInterface<StixObjectPropertiesInterface>
{
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
  @Type(() => StixObjectDto)
  @Expose({ name: "objects" })
  objects: StixObjectDto[];

  constructor(options: EnvelopeConstructorOptions) {
    super(options);
  }
}
