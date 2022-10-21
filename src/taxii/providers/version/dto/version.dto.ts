import { SinglePageInterface } from "src/taxii/providers/pagination/interfaces/single-page.interface";
import { Exclude, Expose, Type } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import {
  GenericPageDto,
  GenericPageOptions,
} from "../../pagination/dto/generic-page.dto";

export interface VersionConstructorOptions extends GenericPageOptions<string> {
  id?: string; // <-- INHERITED
  more?: boolean; // <-- INHERITED
  next?: string; // <-- INHERITED
  items?: string[];
}

export class VersionDto
  extends GenericPageDto
  implements SinglePageInterface<string>
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
  @Type(() => String)
  @Expose({ name: "versions" })
  items: string[];

  constructor(options: VersionConstructorOptions) {
    super(options);
  }
}
