import { Expose, Transform } from 'class-transformer';
import { IsArray, IsOptional } from 'class-validator';
import { GenericPageDto } from '../../pagination/dto/generic-page.dto';

export class EnvelopeDto extends GenericPageDto {
  @Expose()
  @IsArray()
  objects?: Record<string, any>[];

  constructor(partial: Partial<EnvelopeDto>) {
    super(partial);
    this.objects = partial?.objects || [];
  }
}
