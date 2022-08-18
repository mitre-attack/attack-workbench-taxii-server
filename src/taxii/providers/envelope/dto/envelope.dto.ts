import { StixObjectPropertiesInterface } from "src/stix/interfaces/stix-object-properties.interface";
import { SinglePageInterface } from "src/taxii/providers/pagination/interfaces/single-page.interface";
import { Exclude, Expose, Type } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { StixObjectDto } from "src/stix/dto/stix-object.dto";
import {
  GenericPageDto,
  GenericPageOptions,
} from "../../pagination/dto/generic-page.dto";
import { ApiProperty } from "@nestjs/swagger";
import { SwaggerDocumentation as SWAGGER } from "./envelope.dto.swagger.json";

export interface EnvelopeConstructorOptions
  extends GenericPageOptions<StixObjectPropertiesInterface> {
  id?: string; // <-- INHERITED
  more?: boolean; // <-- INHERITED
  next?: string; // <-- INHERITED
  items?: StixObjectPropertiesInterface[];
}

@Exclude()
export class EnvelopeDto
  extends GenericPageDto
  implements SinglePageInterface<StixObjectPropertiesInterface>
{
  @Exclude()
  id: string;

  @ApiProperty({
    description: SWAGGER.More.description,
    type: SWAGGER.More.type,
    required: SWAGGER.More.required,
  })
  @Expose()
  @IsOptional()
  @IsBoolean()
  more: boolean;

  @ApiProperty({
    description: SWAGGER.Next.description,
    type: SWAGGER.Next.type,
    required: SWAGGER.Next.required,
  })
  @Expose()
  @IsString()
  @IsOptional()
  next: string;

  @ApiProperty({
    description: SWAGGER.Objects.description,
    type: SWAGGER.Objects.type,
    required: SWAGGER.Objects.required,
    name: "objects",
  })
  @IsOptional()
  @Type(() => StixObjectDto)
  @Expose({ name: "objects" })
  items: StixObjectPropertiesInterface[];

  constructor(options: EnvelopeConstructorOptions) {
    super(options);
  }
}
