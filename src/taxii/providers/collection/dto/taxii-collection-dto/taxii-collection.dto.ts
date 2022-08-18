import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
  IsUUID,
  IsArray,
} from "class-validator";
import { Exclude, Expose, Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { SwaggerDocumentation as SWAGGER } from "./taxii-collection.dto.swagger.json";
import { DEFAULT_MEDIA_TYPE } from "src/constants";
// import { StixObjectPropertiesInterface } from "src/stix/interfaces/stix-object-properties.interface";

@Exclude()
export class TaxiiCollectionDto {
  constructor(partial: Partial<TaxiiCollectionDto>) {
    Object.assign(this, partial);
    if (!partial["title"]) {
      this.title = this["name"] ? this["name"] : undefined;
    }
    this.canRead = true;
    this.canWrite = false;
    if (!partial["media_types"]) {
      this.mediaTypes = [DEFAULT_MEDIA_TYPE];
    }
  }

  /**
   * @descr       The id property universally and uniquely identifies this Collection. It is used in the Get
   *              Collection Endpoint (see section 5.2) as the {id} parameter to retrieve the Collection.
   * @type        identifier
   * @required    true
   */
  @ApiProperty({
    description: SWAGGER.Id.description,
    type: SWAGGER.Id.type,
    required: SWAGGER.Id.required,
  })
  @Expose()
  @ValidateNested()
  @IsUUID()
  @Type(() => String)
  id: string;

  /**
   * @descr       A human readable plain text title used to identify this Collection.
   * @type        string
   * @required    true
   */
  @ApiProperty({
    description: SWAGGER.Title.description,
    type: SWAGGER.Title.type,
    required: SWAGGER.Title.required,
  })
  @Expose()
  @IsString()
  @Type(() => String)
  title: string;

  /**
   * @descr       A human readable plain text description for this Collection.
   * @type        string
   * @required    false
   */
  @ApiProperty({
    description: SWAGGER.Description.description,
    type: SWAGGER.Description.type,
    required: SWAGGER.Description.required,
  })
  @Expose()
  @IsString()
  @IsOptional()
  @Type(() => String)
  description: string;

  /**
   * @descr       A human readable collection-_dto name that can be used on systems to alias a collection-_dto ID. This
   *              could be used by organizations that want to preconfigure a known collection-_dto of data, regardless
   *              of the underlying collection-_dto ID that is configured on a specific implementations.
   *
   *              If defined, the alias MUST be unique within a single api-root on a single TAXII server. There is
   *              no guarantee that an alias is globally unique across api-roots or TAXII server instances.
   *
   *              Example: /{api-root}/collection-_dto/critical-high-value-indicators/
   * @type        string
   * @required    false
   */
  @ApiProperty({
    description: SWAGGER.Alias.description,
    type: SWAGGER.Alias.type,
    required: SWAGGER.Alias.required,
  })
  @Expose()
  @IsString()
  @IsOptional()
  @Type(() => String)
  alias: string;

  /**
   * @descr       Indicates if the requester can read (i.e., GET) providers from this Collection. If true, users are
   *              allowed to access the Get Objects, Get an Object, or Get Object Manifests endpoints for this
   *              Collection. If false, users are not allowed to access these endpoints.
   * @type        boolean
   * @required    true
   *
   * @note        The TAXII server does not implement authentication, therefore all artifacts are readable. Thus,
   *              'canRead' is always true.
   */
  @ApiProperty({
    description: SWAGGER.CanRead.description,
    type: SWAGGER.CanRead.type,
    required: SWAGGER.CanRead.required,
  })
  @Expose()
  @IsBoolean()
  @Type(() => Boolean)
  canRead: boolean;

  /**
   * @descr       Indicates if the the requester can write (i.e., POST) providers to this Collection. If true, users
   *              are allowed to access the Add Objects endpoint for this Collection. If false, users are not
   *              allowed to access this endpoint.
   * @type        boolean
   * @required    true
   *
   * @note        The TAXII server does not support ingesting/consuming new artifacts at this time, therefore no
   *              artifacts are writable. Thus, 'canWrite' is always false.
   */
  @ApiProperty({
    description: SWAGGER.CanWrite.description,
    type: SWAGGER.CanWrite.type,
    required: SWAGGER.CanWrite.required,
  })
  @Expose()
  @IsBoolean()
  @Type(() => Boolean)
  canWrite: boolean;

  /**
   * @descr       A list of supported media types for Objects in this Collection. Absence of this property is
   *              equivalent to a single-value list containing "application/workbench+json". This list MUST describe
   *              all media types that the Collection can store.
   * @type        list of type string
   * @required    false
   */
  @ApiProperty({
    description: SWAGGER.MediaTypes.description,
    type: SWAGGER.MediaTypes.type,
    required: SWAGGER.MediaTypes.required,
  })
  @Expose()
  //@IsEnum(DEFAULT_MEDIA_TYPE, { each: true }) // solution: https://github.com/typestack/class-validator/issues/159 needs validation
  @IsOptional()
  @IsArray()
  @Type(() => String) // TODO determine how to declare type decorator on array
  mediaTypes: string[];
}
