import { IdentifierDto } from "src/common/models/identifier";

export class StixGranularMarkingDto {
  lang?: string;
  marking_ref?: IdentifierDto;
  selectors: Array<string>;

  constructor(partial?: Partial<any>) {
    Object.assign(this, partial);
  }
}
