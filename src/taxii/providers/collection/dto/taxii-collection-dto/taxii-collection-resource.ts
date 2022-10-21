import { ApiProperty, OmitType } from "@nestjs/swagger";
import { TaxiiCollectionDto } from "./taxii-collection.dto";

export class TaxiiCollectionResource extends OmitType(TaxiiCollectionDto, [
  "canRead",
  "canWrite",
  "mediaTypes",
]) {
  @ApiProperty({
    description:
      "The id property universally and uniquely identifies this Collection. It is used in the Get Collection Endpoint (see section 5.2) as the {id} parameter to retrieve the Collection.",
    type: String,
    required: true,
  })
  id: string;

  @ApiProperty({
    description:
      "A human readable plan text title used to identify this Collection.",
    type: String,
    required: true,
  })
  title: string;

  @ApiProperty({
    description:
      "A human readable plan text description used to identify this Collection.",
    type: String,
    required: false,
  })
  description: string;

  @ApiProperty({
    description:
      "A human readable collection name that can be used on systems to alias a collection ID. This could be used by organizations that want to preconfigure a known collection of data, regardless of the underlying collection ID that is configured on a specific implementations. If defined, the alias MUST be unique within a single api-root on a single TAXII server. There is no guarantee that an alias is globally unique across api-roots or TAXII server instances.\n\nIf defined, the alias MUST be unique within a single api-root on a single TAXII server. There is no guarantee that an alias is globally unique across api-roots or TAXII server instances.\n\nExample: /{api-root}/collections/critical-high-value-indicators.",
    type: String,
    required: false,
  })
  alias: string;

  @ApiProperty({
    description:
      "Indicates if the requester can read (i.e., GET) providers from this Collection. If true, users are allowed to access the Get Objects, Get an Object, or Get Object Manifests endpoints for this Collection. If false, users are not allowed to access these endpoints.",
    type: Boolean,
    required: true,
  })
  can_read: string;

  @ApiProperty({
    description:
      "Indicates if the requester can write (i.e., POST) objects to this Collection. If true, users are allowed to access the Add Objects endpoint for this Collection. If false, users are not allowed to access this endpoint.",
    type: Boolean,
    required: true,
  })
  can_write: string;

  @ApiProperty({
    description:
      'A list of supported media types for Objects in this Collection. Absence of this property is equivalent to a single-value list containing  "application/stix+json". This list MUST describe all media types that the Collection can store.',
    type: [String],
    required: false,
  })
  media_types: string[];
}
