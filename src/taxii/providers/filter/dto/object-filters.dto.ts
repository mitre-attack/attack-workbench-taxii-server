import { MatchDto } from "src/common/models/match/match.dto";
import { Type } from "class-transformer";

export interface ObjectFiltersOptions {
  collectionId?: string;
  objectId?: string;
  addedAfter?: string;
  limit?: number;
  match?: MatchDto;
}

export class ObjectFiltersDto {
  /**
   * Refers to the identifier of the Collection being requested
   */
  @Type(() => String)
  collectionId?: string;

  /**
   * TODO add description
   */
  @Type(() => String)
  objectId?: string;

  /**
   * A single timestamp that filters objects to only include those objects added after the specified timestamp. The
   * value of this parameter is a timestamp.
   */
  // @Type(() => TimestampDto)
  @Type(() => String)
  addedAfter?: string;

  /**
   * A single integer value that indicates the maximum number of objects that the client would like to receive in a
   * single response.
   *
   * Refers to the pagination count, i.e. the number of objects that should be returned to the user
   * e.g. ?limit=...
   */
  @Type(() => Number)
  limit?: number;

  /**
   * Refers to object fields/attributes: [id, type, version, spec_version]
   * e.g. ?match[id]=...
   *      ?match[type]=...
   *      ?match[version]=...
   *      ?match[spec_version]=...
   */
  @Type(() => MatchDto)
  match?: MatchDto;

  /**
   * Default constructor
   * @param options
   */
  constructor(options?: ObjectFiltersOptions) {
    Object.assign(this, options);
  }
}
