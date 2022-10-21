import { IdentifierDto } from "src/common/models/identifier";

export interface GenericPageOptions<T> {
  id?: string;
  more?: boolean;
  next?: string;
  items?: T[];
}

export class GenericPageDto {
  id: string;
  more: boolean;
  next: string;
  items: any[];

  constructor(options: GenericPageOptions<any>) {
    this.id = options.id ? options.id : new IdentifierDto().toString();
    this.more = options.more ? options.more : false;
    this.next = options.next ? options.next : undefined;
    this.items = options.items ? options.items : [];
  }

  /**
   * toJSON allows the controller to remove the items/objects property from the object if there are no elements in
   * the array. This is a requirement of the TAXII 2.1 specification.
   *
   * The specification states:
   * Empty lists are prohibited in TAXII and MUST NOT be used as a substitute for omitting optional properties. If the
   * property is required, the list MUST be present and MUST have at least one value.
   */
  toJSON() {
    if (this.items.length === 0) {
      this.items = undefined;
    }
    return this;
  }
}
