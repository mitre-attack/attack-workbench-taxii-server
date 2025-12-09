import { ApiProperty, OmitType } from '@nestjs/swagger';
import { DiscoveryDto } from './discovery.dto';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class DiscoveryResource extends OmitType(DiscoveryDto, []) {
  @ApiProperty({
    description: 'A human readable plain text name used to identify this server.',
    type: String,
    required: true,
  })
  title: string;

  @ApiProperty({
    description:
      'The human readable plain text contact information for this server and/or the administrator of this server.',
    type: String,
    required: false,
  })
  contact?: string;

  @ApiProperty({
    description: 'A human readable plain text description for this server.',
    type: String,
    required: false,
  })
  description?: string;

  @ApiProperty({
    description:
      'The default API Root that a TAXII Client MAY use. Absence of this property indicates that there is no default API Root. The default API Root MUST be an object in api_roots.',
    type: String,
    required: false,
  })
  default?: string;

  @ApiProperty({
    description:
      'A list of URLs that identify known API Roots. This list MAY be filtered on a per-client basis.',
    type: [String],
    required: false,
  })
  api_roots?: string[];
}
