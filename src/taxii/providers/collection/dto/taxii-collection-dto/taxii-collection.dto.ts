import { IsBoolean, IsOptional, IsString, ValidateNested, IsUUID, IsArray } from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { ALL_MEDIA_TYPES } from 'src/common/middleware/content-negotiation';
import { WorkbenchCollectionDto } from 'src/stix/dto/workbench-collection.dto';

@Exclude()
export class TaxiiCollectionDto {
  constructor(partial: Partial<TaxiiCollectionDto> | WorkbenchCollectionDto) {
    // If we're passed a WorkbenchCollectionDto, extract the STIX data
    if (partial instanceof WorkbenchCollectionDto) {
      partial = partial.stix;
    }

    // Handle case where partial is the STIX object directly
    if (partial && 'stix' in partial) {
      partial = partial.stix;
    }

    Object.assign(this, partial);

    // Handle title/name conversion
    if (!this.title) {
      this.title = (partial as any)?.name;
    }

    // Set default values
    this.canRead = true;
    this.canWrite = false;
    if (!this.mediaTypes) {
      this.mediaTypes = ALL_MEDIA_TYPES;
    }
  }

  /**
   * @descr       The id property universally and uniquely identifies this Collection. It is used in the Get
   *              Collection Endpoint (see section 5.2) as the {id} parameter to retrieve the Collection.
   * @type        identifier
   * @required    true
   */
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
  @Expose()
  @IsString()
  @Type(() => String)
  title: string;

  /**
   * @descr       A human readable plain text description for this Collection.
   * @type        string
   * @required    false
   */
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
  @Expose()
  //@IsEnum(DEFAULT_MEDIA_TYPE, { each: true }) // solution: https://github.com/typestack/class-validator/issues/159 needs validation
  @IsOptional()
  @IsArray()
  @Type(() => String)
  mediaTypes: string[];
}
