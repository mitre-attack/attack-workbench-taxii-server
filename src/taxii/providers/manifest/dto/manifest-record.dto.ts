import { Exclude, Expose, Type } from "class-transformer";
import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { SwaggerDocumentation as SWAGGER } from "./manifest-record.dto.swagger.json";
import { StixObjectPropertiesInterface } from "src/stix/interfaces/stix-object-properties.interface";

/**
 * The manifest-record type captures metadata about a single version of an object, indicated by the id property. The
 * metadata includes information such as when that version of the object was added to the Collection, the version of the
 * object itself, and the media type that this specific version of the object is available in.
 */
@Exclude()
export class ManifestRecordDto {
  /**
   * @descr       The identifier of the object that this manifest entry describes. For STIX objects the id MUST be the
   *              STIX Object id. For object types that do not have their own identifier, the server MAY use any value
   *              as the id.
   * @type        string
   * @required    true
   */
  @ApiProperty({
    description: SWAGGER.Id.description,
    type: SWAGGER.Id.type,
    required: SWAGGER.Id.required,
  })
  @IsString()
  @Expose()
  id: string;

  @ApiProperty({
    description: SWAGGER.DateAdded.description,
    type: SWAGGER.DateAdded.type,
    required: SWAGGER.DateAdded.required,
  })
  @Type(() => String)
  @Expose({ name: "date_added" })
  dateAdded: string;

  @ApiProperty({
    description: SWAGGER.Version.description,
    type: SWAGGER.Version.type,
    required: SWAGGER.Version.required,
  })
  @IsString()
  @Expose()
  version: string;

  @ApiProperty({
    description: SWAGGER.MediaType.description,
    type: SWAGGER.MediaType.type,
    required: SWAGGER.MediaType.required,
  })
  @IsString()
  @Expose({ name: "media_type" })
  mediaType: string;

  constructor(stixObject: StixObjectPropertiesInterface) {
    this.id = stixObject.id;
    this.dateAdded = new Date(stixObject.created).toISOString();
    this.mediaType = "application/stix+taxii;version=2.1"; // TODO This value MUST be one of the media types listed on the collection resource.
    this.version = new Date(stixObject.modified).toISOString();
  }
}
