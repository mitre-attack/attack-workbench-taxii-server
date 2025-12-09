import { Expose } from 'class-transformer';
import { IsArray } from 'class-validator';
import { GenericPageDto } from '../../pagination/dto/generic-page.dto';

export class EnvelopeDto extends GenericPageDto {
  @Expose()
  @IsArray()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  objects?: Record<string, any>[];

  constructor(partial: Partial<EnvelopeDto>) {
    super(partial);
    this.objects = partial?.objects || [];
  }
}
