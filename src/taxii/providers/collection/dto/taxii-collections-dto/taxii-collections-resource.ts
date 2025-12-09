import { TaxiiCollectionsDto } from './taxii-collections.dto';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { TaxiiCollectionDto } from '../taxii-collection-dto';
import { TaxiiCollectionResource } from '../taxii-collection-dto/taxii-collection-resource';

export class TaxiiCollectionsResource extends OmitType(TaxiiCollectionsDto, [
  'push',
  'pop',
  'length',
]) {
  @ApiProperty({
    description:
      'A list of Collections. If there are no Collections in the list, this key MUST be omitted, and the response is an empty object. The collection resource is defined in section 5.2.1.',
    required: false,
    type: [TaxiiCollectionResource],
  })
  collections: TaxiiCollectionDto[];
}
