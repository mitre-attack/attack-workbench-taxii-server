import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ManifestRecordDto } from './manifest-record.dto';

export class ManifestRecordResource extends OmitType(ManifestRecordDto, [
  'mediaType',
  'dateAdded',
]) {
  @ApiProperty({
    description:
      'The identifier of the object that this manifest entry describes. For STIX objects the id MUST be the STIX Object id. For object types that do not have their own identifier, the server MAY use any value as the id.',
    type: String,
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'The date and time this object was added.',
    type: Date,
    required: true,
  })
  date_added: string;

  @ApiProperty({
    description:
      'The version of this object.\n\n \n\nFor objects in STIX format, the STIX modified property is the version. If a STIX object is not versioned (and therefore does not have a modified timestamp), the server MUST use the created timestamp. If the STIX object does not have a created or modified timestamp then the server SHOULD use a value for the version that is consistent to the server.',
    type: String,
    required: true,
  })
  version: string;

  @ApiProperty({
    description:
      'The media type that this specific version of the object can be requested in. This value MUST be one of the media types listed on the collection resource.',
    type: String,
    required: false,
  })
  media_type: string;
}
