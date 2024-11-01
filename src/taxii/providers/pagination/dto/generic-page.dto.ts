import { Expose, Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class GenericPageDto {

  @Expose()
  @IsBoolean()
  @IsOptional()
  more?: boolean;

  @Expose()
  @IsString()
  @IsOptional()
  next?: string;

  constructor(partial: Partial<GenericPageDto>) {
    if (partial) {
      this.more = partial.more;
      this.next = partial.next;
    }
  }
}