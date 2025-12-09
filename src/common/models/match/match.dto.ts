import { IsOptional, IsString } from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SwaggerDocumentation as SWAGGER } from './match.dto.swagger.json';

@Exclude()
export class MatchDto {
  @ApiProperty({
    description: SWAGGER.Match.Id.Description,
    required: false,
    type: [String],
  })
  @IsString({ each: true })
  @IsOptional()
  @Type(() => String)
  @Expose()
  id?: string[];

  @ApiProperty({
    description: SWAGGER.Match.Type.Description,
    required: false,
    type: [String],
  })
  @IsString({ each: true })
  @IsOptional()
  @Type(() => String)
  @Expose()
  type?: string[];

  @ApiProperty({
    description: SWAGGER.Match.Version.Description,
    required: false,
    type: [String],
  })
  @IsString({ each: true })
  @IsOptional()
  @Type(() => String)
  @Expose()
  version?: string[];

  @ApiProperty({
    description: SWAGGER.Match.SpecVersion.Description,
    required: false,
    type: [String],
  })
  @IsString({ each: true })
  @IsOptional()
  @Type(() => String)
  @Expose()
  spec_version?: string[];

  get specVersion() {
    return this.spec_version;
  }

  constructor(partial?: Partial<any>) {
    Object.assign(this, partial);
  }
}
