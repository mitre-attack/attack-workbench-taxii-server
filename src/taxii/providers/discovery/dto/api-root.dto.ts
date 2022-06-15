import { IsEnum, IsOptional, IsString } from "class-validator";
import { Exclude, Expose } from "class-transformer";

export interface ApiRootOptions {
  title?: string;
  description?: string;
  version?: string;
  maxContentLength?: number;
}

@Exclude()
export class ApiRootDto {
  /**
   * @descr       A human readable plain text name used to identify this API instance
   * @type        string
   * @required    true
   */
  @Expose()
  @IsString()
  title: string;

  /**
   * @descr       A human readable plain text description for this API Root.
   * @type        string
   * @required    false
   */
  @Expose()
  @IsOptional()
  description: string | undefined;

  /**
   * @descr       The list of TAXII version that this API Root is compatible with. The values listed in this
   *              property MUST match the media types defined in Section 1.6.8.1 and MUST include the optional
   *              version parameter. A value of "application/providers+json;version=2.1" MUST be included in this list
   *              to indicate conformance with this specification.
   * @type        list of type string
   * @required    true
   */
  @Expose()
  //@IsEnum(DEFAULT_MEDIA_TYPE)  TODO: determine how to validate that string is equal to MediaType.get()
  version: string;

  /**
   * @descr       The maximum size of the request body in octets (8-bit bytes) that the server can support. The
   *              value of the max_content_length MUST be a positive integer greater than zero. This applies to
   *              requests only and is determined by the server. Requests with total body length values smaller
   *              than this value MUST NOT result in an HTTP 413 (Request Entity Too Large) response. If for
   *              example, the server supported 100 MB of data, the value for this property would be determined by
   *              100*1024*1024 which equals 104,857,600. This property contains useful information for the client
   *              when it POSTs requests to the Add Objects endpoint.
   * @type        Number (integer)
   * @required    true
   */
  @Expose()
  //@IsEnum(MaxContentLength)
  maxContentLength: 1000;

  constructor(options: ApiRootOptions) {
    Object.assign(this, options);
  }
}
