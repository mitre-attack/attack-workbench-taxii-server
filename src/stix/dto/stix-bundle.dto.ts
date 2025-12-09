import { Expose, Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested, IsUUID } from 'class-validator';

export class StixBundleDto {
  @Expose()
  @IsUUID()
  id: string;

  @Expose()
  @IsString()
  type: string;

  @Expose()
  @IsString()
  spec_version: string;

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object) // Allow any object type in the array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objects: { [key: string]: any }[]; // Flexible type for STIX objects
}
