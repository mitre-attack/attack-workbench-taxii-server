import { ApiProperty, OmitType } from '@nestjs/swagger';
import { ApiRootDto } from './api-root.dto';

export class ApiRootResource extends OmitType(ApiRootDto, ['maxContentLength']) {
  @ApiProperty({
    description: 'A human readable plain text name used to identify this API instance.',
    type: String,
    required: true,
  })
  title: string;

  @ApiProperty({
    description: 'A human readable plain text description for this API Root.',
    type: String,
    required: false,
  })
  description?: string;

  @ApiProperty({
    description:
      'The list of TAXII versions that this API Root is compatible with. The values listed in this property MUST match the media types defined in Section 1.6.8.1 and MUST include the optional version parameter.',
    type: [String],
    required: true,
  })
  version: string;

  @ApiProperty({
    description:
      'The maximum size of the request body in octets (8-bit bytes) that the server can support. The value of the max_content_length MUST be a positive integer greater than zero.',
    type: Number,
    required: true,
  })
  max_content_length: number;
}
