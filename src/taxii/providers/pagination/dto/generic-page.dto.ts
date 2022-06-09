import {IdentifierDto} from "src/common/models/identifier";

export interface GenericPageOptions<T>{
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

}