import { Exclude, Expose } from "class-transformer";
import { IsEmail, IsOptional, IsString } from "class-validator";

@Exclude()
export class DiscoveryDto {
  /**
   * @descr       A human readable plain text name used to identify this server.
   * @type        string
   * @required    true
   */
  @Expose()
  @IsString()
  title: string;

  /**
   * @descr       The human readable plain text contact information for this server and/or the administrator of
   *              this server.
   * @type        string
   * @required    false
   */
  @Expose()
  @IsEmail({}, { message: "Invalid email address" })
  @IsOptional()
  contact?: string;

  /**
   * @descr       A human readable plain text description for this server.
   * @type        string
   * @required    false
   */
  @Expose()
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * @descr       The default API Root that a TAXII Client MAY use. Absence of this property indicates that there
   *              is no default API Root. The default API Root MUST be an object in api_roots.
   * @type        string
   * @required    false
   */
  @Expose()
  @IsOptional()
  default?: string;

  /**
   * @descr       A list of URLs that identify known API Roots. This list MAY be filtered on a per-client basis.
   *              API Root URLs MUST be HTTPS absolute URLs or relative URLs. API Root relative URLs MUST begin
   *              with a single `/` character and MUST NOT begin with `//` or '../". API Root URLs MUST NOT
   *              contain a URL query component.
   * @type        Array
   * @required    false
   */
  @Expose()
  @IsOptional()
  apiRoots?: string[];

  constructor(partial?: Partial<DiscoveryDto>) {
    Object.assign(this, partial);
  }
}
