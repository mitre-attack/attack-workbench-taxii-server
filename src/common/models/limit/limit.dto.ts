import { IsNumber, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class LimitDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}
