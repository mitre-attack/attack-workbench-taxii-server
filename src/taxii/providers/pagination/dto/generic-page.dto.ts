import { IdentifierDto } from "src/common/models/identifier";

export interface GenericPageOptions<T> {
  id?: string;
  more?: boolean;
  next?: string;
  objects?: T[];
}

export class GenericPageDto {
  id: string;
  more: boolean;
  next: string;
  objects: any[];

  constructor(options: GenericPageOptions<any>) {
    this.id = options.id ? options.id : new IdentifierDto().toString();
    this.more = options.more ? options.more : false;
    this.next = options.next ? options.next : undefined;
    this.objects = options.objects ? options.objects : [];
  }

  /**
   * toJSON allows the controller to remove the objects property from the object if there are no elements in
   * the array. This is a requirement of the TAXII 2.1 specification.
   *
   * The specification states:
   * Empty lists are prohibited in TAXII and MUST NOT be used as a substitute for omitting optional properties. If the
   * property is required, the list MUST be present and MUST have at least one value.
   */
  toJSON() {
    if (this.objects.length === 0) {
      this.objects = undefined;
    }
    return this;
  }
}
