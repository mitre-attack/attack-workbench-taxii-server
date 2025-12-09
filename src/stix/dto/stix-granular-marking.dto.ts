import { IdentifierDto } from 'src/common/models/identifier';

export class StixGranularMarkingDto {
  lang?: string;
  marking_ref?: IdentifierDto;
  selectors: Array<string>;

  constructor(partial?: Partial<StixGranularMarkingDto>) {
    Object.assign(this, partial);
  }
}
