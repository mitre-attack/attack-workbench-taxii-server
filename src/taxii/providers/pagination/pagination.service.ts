import { Injectable } from '@nestjs/common';
import { isNumber } from '@nestjs/common/utils/shared.utils';
import { TaxiiNotFoundException } from 'src/common/exceptions';
import { TaxiiLoggerService as Logger } from 'src/common/logger';
import { EnvelopeDto } from '../envelope';
import { ManifestDto, ManifestRecordDto } from '../manifest/dto';
import { VersionsDto } from '../version/dto/versions.dto';
// import { StixObjectDto } from "src/stix/dto/stix-object.dto";

@Injectable()
export class PaginationService {
  constructor(private readonly logger: Logger) {
    logger.setContext(PaginationService.name);
  }

  /**
   * Handles pagination of STIX object, manifest-record, and version string arrays. This is where all pagination logic
   * lives. The other class methods (which are public) call this method to process pages. They themselves just
   * transform the generic response object to their respective resource types.
   *
   * Example pagination:
   * all_objects = [a,b,c,d,e,f,g], length=7
   * limit=2, next=2
   * resulting pages = {
   *  page-0: [a,b],
   *  page-1: [c,d],
   *  page-2: [e,f], <-- this is the requested page
   *  page-3: [g] <-- `isMore` determines if this page exists
   * }
   * We know there are additional pages after page-2 because:
   * - nextPage + currentPage < totalobjects
   * - (limit) + (limit*next) < objects.length
   * - (2) + (2*2) < 7
   * - 6 < 7
   *
   * @param items Array of items to paginate
   * @param limit The number of items that should be included on the page
   * @param next Specifies which page is being requested
   * @private
   */
  private async getPage<T>(
    items: T[],
    limit?: number,
    next?: number,
  ): Promise<{ more?: boolean; next?: string; items: T[] }> {
    // Pagination can only occur if `limit` is defined and valid
    if (isNumber(limit)) {
      // Handle case where next page is specified
      if (isNumber(next)) {
        if (limit * next <= items.length) {
          const isMore: boolean = limit + limit * next < items.length;
          return {
            more: isMore,
            next: isMore ? String(next + 1) : undefined,
            items: items.slice(limit * next, limit + limit * next),
          };
        }
        // The values for `next` and `limit` are invalid for the selected items array.
        // This happens when requesting a page that doesn't exist.
        throw new TaxiiNotFoundException({
          title: 'Invalid URL Query Parameters',
          description: `The server was unable to process a page where 'next' equals ${next} and 'limit' equals ${limit}`,
        });
      }
      // Handle first page when only limit is specified
      const isMore: boolean = limit < items.length;
      return {
        more: isMore,
        next: isMore ? '1' : undefined,
        items: items.slice(0, limit),
      };
    }
    // Return all items if no pagination parameters specified
    return {
      items,
    };
  }

  /**
   * Paginates an array of STIX objects
   * @param objects The array of STIX objects that should be paginated
   * @param limit The number of objects that should be included on the page
   * @param next Specifies which page is being requested
   */
  async getEnvelope(objects: object[], limit?: number, next?: number): Promise<EnvelopeDto> {
    const page = await this.getPage(objects, limit, next);
    return new EnvelopeDto({
      more: page.more,
      next: page.next,
      objects: page.items,
    });
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
    next?: number,
  ): Promise<ManifestDto> {
    const page = await this.getPage(objects, limit, next);
    return new ManifestDto({
      more: page.more,
      next: page.next,
      objects: page.items,
    });
  }

  /**
   * Paginates an array of object versions
   * @param versions The array of object versions (which are just strings) that should be paginated
   * @param limit The number of versions that should be included on the page
   * @param next Specifies which page is being requested
   */
  async getVersion(versions: string[], limit?: number, next?: number): Promise<VersionsDto> {
    const page = await this.getPage(versions, limit, next);
    return new VersionsDto({
      more: page.more,
      next: page.next,
      versions: page.items,
    });
  }
}
