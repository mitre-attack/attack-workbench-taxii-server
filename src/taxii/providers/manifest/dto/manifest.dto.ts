import { Expose, Type } from "class-transformer";
import { IsArray } from "class-validator";
import { GenericPageDto } from "../../pagination/dto/generic-page.dto";
import { ManifestRecordDto } from "./manifest-record.dto";

interface ManifestDtoConstructor {
  more?: boolean;
  next?: string;
  objects?: ManifestRecordDto[];
}

export class ManifestDto extends GenericPageDto {
  @Expose()
  @IsArray()
  @Type(() => ManifestRecordDto)
  objects?: ManifestRecordDto[];

  constructor(data?: ManifestDtoConstructor) {
    super({
      more: data?.more,
      next: data?.next,
    });

    this.objects = data.objects;
  }
}
