import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class NextDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  next: number;
}
