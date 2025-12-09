import { IsString } from 'class-validator';
import { v4 as uuid } from 'uuid';

export class IdentifierDto {
  @IsString()
  private readonly uuid: string;

  constructor(id?: any) {
    this.uuid = id ? id.toString() : uuid(); // '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
  }

  toString() {
    return this.uuid;
  }
}
