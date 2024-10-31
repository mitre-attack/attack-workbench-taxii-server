import { Exclude, Expose, Type } from "class-transformer";
import { IsArray, IsString } from "class-validator";
import { GenericPageDto } from "../../pagination/dto/generic-page.dto";

interface VersionDtoConstructor {
  more?: boolean;
  next?: string;
  versions?: string[];
}

export class VersionDto extends GenericPageDto {
  @Expose()
  @IsArray()
  // @IsString({ each: true })
  @Type(() => String)
  versions: string[];

  constructor(data?: VersionDtoConstructor) {
    super(data);
    this.versions = data.versions;
  }
}