import { Expose } from 'class-transformer';
import { IsArray } from 'class-validator';
import { GenericPageDto } from '../../pagination/dto/generic-page.dto';

export class EnvelopeDto extends GenericPageDto {
  @Expose()
  @IsArray()
  objects?: Record<string, unknown>[];

  constructor(partial: Partial<EnvelopeDto>) {
    super(partial);
    this.objects = partial?.objects || [];
  }
}
