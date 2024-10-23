import { Injectable } from "@nestjs/common";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import "object-hash";
import { TaxiiNotFoundException } from "src/common/exceptions";
import { StixObjectPropertiesInterface } from "src/stix/interfaces/stix-object-properties.interface";
import { EnvelopeDto } from "../envelope";
import { isNumber } from "@nestjs/common/utils/shared.utils";
import { ManifestDto, ManifestRecordDto } from "../manifest/dto";
import { VersionDto } from "../version/dto/version.dto";
import { GenericPageDto } from "./dto/generic-page.dto";

@Injectable()
export class PaginationService {
  constructor(private readonly logger: Logger) {
    logger.setContext(PaginationService.name);
  }

  /**
   * Handles pagination of STIX object, manifest-record, and version string arrays. This is where all pagination logic
   * lives. The other class methods (which are public) call this method to process pages. They themselves just
   * transform the generic response object (an instance of GenericPageDto) to their respective resource types.
   * @param objects A list of either: ManifestRecordDto (if being called by the ManifestService), string (if being
   *              called by the VersionService), StixObjectPropertiesInterface (if being called by the EnvelopeService)
   * @param limit The number of objects that should be included on the page
   * @param next Specifies which page is being requested
   * @private
   */
  private async getPage(
    objects: any[],
    limit?: number,
    next?: number
  ): Promise<GenericPageDto> {
    // Pagination can only occur if `limit` is defined and valid.
    if (isNumber(limit)) {
      // A valid `limit` parameter was passed!
      this.logger.debug(
        `Limit is defined. Attempting to paginate via limit (${limit})`,
        this.constructor.name
      );
      /**
       * `next` is the mechanism by which we walk through pages.
       * If `next` is not defined or valid, then we will just return page 1.
       */
      if (isNumber(next)) {
        // A valid `next` parameter was passed!
        this.logger.debug(
          `Next is defined. Attempting to paginate via limit (${limit}) and next (${next})`,
          this.constructor.name
        );
        /**
         * The following `if` condition determines whether pagination is even possible for the supplied `objects`,
         * `limit`, and `next` combination. For example, it is possible for the user to request a page that does not
         * exist.
         */
        if (limit * next <= objects.length) {
          /**
           * Example:
           * all_objects = [a,b,c,d,e,f,g], length=7
           * limit=2, next=2
           * resulting pages = {
           *  page-0: [a,b],
           *  page-1: [c,d],
           *  page-2: [e,f], <-- this is the requested page
           *  page-3: [g] <-- `isMore` determines if this page exists
           *  }
           *  We know there are additional pages after page-2 because:
           *  - nextPage + currentPage < totalobjects
           *  - (limit) + (limit*next) < objects.length
           *  - (2) + (2*2) < 7
           *  - 6 < 7
           */
          const isMore: boolean = limit + limit * next < objects.length;

          return new GenericPageDto({
            more: isMore,
            next: isMore ? String(next + 1) : undefined,
            objects: objects.slice(limit * next, limit + limit * next),
          });
        }

        /**
         * The values for `next` and `limit` are invalid for the selected objects array. Usually this happens as a result
         * of the user requesting a page that does not exist.
         *
         * e.g., We have 10 objects and want to paginate by 5 (limit=5). Therefore, there should be two pages. However,
         * the user requested page 3 (next=3), resulting in an out of bounds exception. In this case, we return a 400
         * response.
         */
        throw new TaxiiNotFoundException({
          title: "Invalid URL Query Parameters",
          description: `The server was unable to process a page where 'next' equals ${next} and 'limit' equals ${limit}`,
        });
      }
      // The else block will execute if next was undefined or invalid
      else {
        // Paginating by `limit`. This will only ever resolve to the first page, since `next` is the mechanism by which
        // we step through pages.

        const isMore: boolean = limit < objects.length;

        // Return page 1
        return new GenericPageDto({
          more: isMore,
          next: isMore ? "1" : undefined,
          objects: objects.slice(0, limit),
        });
      }
    }

    this.logger.debug(
      "Pagination bypassed. Returning page containing all available objects",
      this.constructor.name
    );
    return new GenericPageDto({
      more: false,
      objects: objects,
    });
  }

  /**
   * Paginates an array of STIX objects
   * @param objects The array of STIX objects that should be paginated
   * @param limit The number of objects that should be included on the page
   * @param next Specifies which page is being requested
   */
  async getEnvelope(
    objects: StixObjectPropertiesInterface[],
    limit?: number,
    next?: number
  ): Promise<EnvelopeDto> {
    return new EnvelopeDto(await this.getPage(objects, limit, next));
  }

  /**
   * Paginates an array of manifest records
   * @param objects The array of manifest records that should be paginated
   * @param limit The number of manifest records that should be included on the page
   * @param next Specifies which page is being requested
   */
  async getManifest(
    objects: ManifestRecordDto[],
    limit?: number,
    next?: number
  ): Promise<ManifestDto> {
    return new ManifestDto(await this.getPage(objects, limit, next));
  }

  /**
   * Paginates an array of object versions
   * @param objects The array of object versions (which are just strings) that should be paginated
   * @param limit The number of versions that should be included on the page
   * @param next Specifies which page is being requested
   */
  async getVersion(
    objects: string[],
    limit?: number,
    next?: number
  ): Promise<VersionDto> {
    return new VersionDto(await this.getPage(objects, limit, next));
  }
}
