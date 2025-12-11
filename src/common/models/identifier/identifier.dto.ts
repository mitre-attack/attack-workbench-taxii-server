import { IsString } from 'class-validator';
import { randomUUID } from 'crypto';

export class IdentifierDto {
  @IsString()
  private readonly uuid: string;

  constructor(id?: unknown) {
    this.uuid = id ? id.toString() : randomUUID(); // '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
  }

  toString() {
    return this.uuid;
  }
}
