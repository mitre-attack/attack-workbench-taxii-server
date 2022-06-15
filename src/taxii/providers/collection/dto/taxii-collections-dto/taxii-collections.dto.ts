import { Type, Exclude, Expose } from "class-transformer";
import { TaxiiCollectionDto } from "../taxii-collection-dto";
import { ApiProperty } from "@nestjs/swagger";
import { SwaggerDocumentation as SWAGGER } from "./taxii-collections.dto.swagger.json";
import { IsArray } from "class-validator";

@Exclude()
export class TaxiiCollectionsDto {
  @ApiProperty({
    description: SWAGGER.Collections.description,
    required: SWAGGER.Collections.required,
    type: () => TaxiiCollectionDto,
  })
  @Expose()
  @IsArray({ each: true })
  @Type(() => TaxiiCollectionDto)
  collections: TaxiiCollectionDto[];

  push(newCollection: TaxiiCollectionDto) {
    return this.collections.push(newCollection);
  }

  pop() {
    return this.collections.pop();
  }

  get length() {
    return this.collections.length;
  }

  constructor() {
    this.collections = [];
  }
}
