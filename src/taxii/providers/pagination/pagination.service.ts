import {Injectable} from "@nestjs/common";
import {TaxiiLoggerService as Logger} from "src/common/logger";
import 'object-hash';
import {TaxiiNotFoundException} from "src/common/exceptions";
import {StixObjectPropertiesInterface} from "src/stix/dto/interfaces/stix-object-properties.interface";
import {EnvelopeDto} from "../envelope";
import {isNumber} from "@nestjs/common/utils/shared.utils";
import {ManifestDto, ManifestRecordDto} from "../manifest/dto";
import {VersionDto} from "../version/dto/version.dto";
import {GenericPageDto} from "./dto/generic-page.dto";


@Injectable()
export class PaginationService {

    constructor(private readonly logger: Logger) {
        logger.setContext(PaginationService.name);
    }

    /**
     * Handles pagination of STIX object, manifest-record, and version string arrays. This is where all pagination logic
     * lives. The other class methods (which are public) call this method to process pages. They themselves just
     * transform the generic response object (an instance of GenericPageDto) to their respective resource types.
     * @param items A list of either: ManifestRecordDto (if being called by the ManifestService), string (if being
     *              called by the VersionService), StixObjectPropertiesInterface (if being called by the EnvelopeService)
     * @param limit The number of objects that should be included on the page
     * @param next Specifies which page is being requested
     * @private
     */
    private async getPage(
        items: any[],
        limit?: number,
        next?: number) : Promise<GenericPageDto>
    {
        if (!isNaN(limit) && isNumber(limit) ) {
            // A valid `limit` parameter was passed!
            this.logger.debug(`Limit is defined. Attempting to paginate via limit (${limit})`, this.constructor.name);

            if (!isNaN(next) && isNumber(next)) {
                // A valid `next` parameter was passed!
                this.logger.debug(`Next is defined. Attempting to paginate via limit (${limit}) and next (${next})`, this.constructor.name);

                if (limit * next < items.length - 1) {
                    // `next` acts as a multiplier, therefore we can only return the next page if the product of
                    // limit * next does not result in us overflowing
                    return new GenericPageDto({
                        more: limit+limit*next < items.length - 1,
                        next: limit+limit*next < items.length - 1 ? String(next+1) : undefined,
                        items: items.slice(limit*next, limit+limit*next)
                    });
                }
                throw new TaxiiNotFoundException({
                    title: 'Invalid URL Query Parameters',
                    description: `The server was unable to process a page where 'next' equals ${next} and 'limit' equals ${limit}`
                });
            }

            else {
                /**
                 * `next` was either invalid or not passed!
                 *
                 * Fall back to paginating by `limit` only.
                 *
                 * Note that the `stixObjects` array is filtered by `addedAfter` *before* it is returned to the
                 * pagination service. Therefore, we can just return the first page of objects.
                 */
                return new GenericPageDto({
                    more: limit + limit < items.length - 1,
                    next: 1 < items.length -1 ? "1" : undefined,
                    items: items.slice(0, limit)
                });
            }
        }

        this.logger.debug('Pagination bypassed. Returning page containing all available items', this.constructor.name);
        return new GenericPageDto({
            more: false,
            items: items
        });

    }

    /**
     * Paginates an array of STIX objects
     * @param items The array of STIX objects that should be paginated
     * @param limit The number of objects that should be included on the page
     * @param next Specifies which page is being requested
     */
    async getEnvelopes(
        items: StixObjectPropertiesInterface[],
        limit?: number,
        next?: number) : Promise<EnvelopeDto>
    {
        return new EnvelopeDto(
            (await this.getPage(items, limit, next))
        );
    }


    /**
     * Paginates an array of manifest records
     * @param items The array of manifest records that should be paginated
     * @param limit The number of manifest records that should be included on the page
     * @param next Specifies which page is being requested
     */
    async getManifests(
        items: ManifestRecordDto[],
        limit?: number,
        next?: number) : Promise<ManifestDto>
    {
        return new ManifestDto(
            await this.getPage(items, limit, next)
        );
    }


    /**
     * Paginates an array of object versions
     * @param items The array of object versions (which are just strings) that should be paginated
     * @param limit The number of versions that should be included on the page
     * @param next Specifies which page is being requested
     */
    async getVersions(
        items: string[],
        limit?: number,
        next?: number) : Promise<VersionDto>
    {
        return new VersionDto(
            (await this.getPage(items, limit, next))
        );
    }
}