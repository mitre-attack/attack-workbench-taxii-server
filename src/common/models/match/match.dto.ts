import { IsOptional, IsString } from "class-validator";
import { Exclude, Type } from "class-transformer";

@Exclude()
export class MatchDto {
  @IsString()
  @IsOptional()
  @Type(() => String)
  id?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  type?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  version?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  latest: boolean;

  @IsString()
  @IsOptional()
  @Type(() => String)
  specVersion?: string;

  constructor(partial?: Partial<any>) {
    Object.assign(this, partial);
    this.latest = !this.version;
  }
}
