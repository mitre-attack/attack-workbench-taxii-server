import { Type, Exclude, Expose } from 'class-transformer';
import { TaxiiCollectionDto } from '../taxii-collection-dto';
import { IsArray } from 'class-validator';

@Exclude()
export class TaxiiCollectionsDto {
  @Expose()
  @IsArray({ each: true })
  @Type(() => TaxiiCollectionDto)
  collections: TaxiiCollectionDto[];

  push(newCollection: TaxiiCollectionDto) {
    return this.collections.push(newCollection);
  }

  pop() {
    return this.collections.pop();
  }

  get length() {
    return this.collections.length;
  }

  constructor() {
    this.collections = [];
  }
}
