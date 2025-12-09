import { Expose } from 'class-transformer';
import { IsArray } from 'class-validator';
import { GenericPageDto } from '../../pagination/dto/generic-page.dto';

interface VersionsDtoConstructor {
  more?: boolean;
  next?: string;
  versions?: string[];
}

export class VersionsDto extends GenericPageDto {
  @Expose()
  @IsArray()
  versions: string[];

  constructor(data?: VersionsDtoConstructor) {
    super(data);
    this.versions = data?.versions || [];
  }
}
