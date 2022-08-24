import { Injectable } from "@nestjs/common";
import { ObjectService } from "../object";
import { MatchDto } from "src/common/models/match/match.dto";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { ObjectFiltersDto } from "../filter/dto";
import "object-hash";
import { TaxiiNotFoundException } from "src/common/exceptions";
import { StixObjectPropertiesInterface } from "src/stix/interfaces/stix-object-properties.interface";
import { EnvelopeDto } from "./dto";
import { PaginationService } from "../pagination";

@Injectable()
export class EnvelopeService {
  constructor(
    private readonly logger: Logger,
    private readonly objectsService: ObjectService,
    private readonly paginationService: PaginationService
  ) {
    logger.setContext(EnvelopeService.name);
  }
  /**
   * Returns an envelope containing STIX objects as determined by the search criteria.
   * @param collectionId All returned STIX objects must belong to the specified collection
   * @param addedAfter? All returned STIX objects must have been created before the specified date
   * @param limit? The total number of returned STIX objects must not exceed the pagination limit
   * @param next? Refers to the unique envelope ID. Indicates which envelope should be returned.
   * @param match? All returned STIX objects must match all of the specified search criteria.
   */
  async findByCollectionId(
    collectionId: string,
    addedAfter?: string,
    limit?: number,
    next?: number,
    match?: MatchDto
  ): Promise<EnvelopeDto> {
    const filters = new ObjectFiltersDto({
      collectionId,
      addedAfter,
      limit,
      match,
    });

    // First, get all of the STIX objects. Once acquired, we will paginate them into envelopes.
    const stixObjects: StixObjectPropertiesInterface[] =
      await this.objectsService.findByCollectionId(filters);

    // Paginate the array of STIX objects and return the requested page & page count
    return await this.paginationService.getEnvelope(stixObjects, limit, next);
  }

  /**
   * Returns one or more versions of a STIX object
   * @param collectionId The collection to which the target STIX object belongs
   * @param objectId The unique ID of the target STIX object
   * @param addedAfter A single timestamp
   * @param limit A single integer indicating the maximum number of objects which should be included in the response
   * @param match Contains object filters such as spec_version and type. See the TAXII 2.1 specification for details.
   */
  async findByObjectId(
    collectionId: string,
    objectId: string,
    addedAfter?: string,
    limit?: number,
    match?: MatchDto
  ): Promise<EnvelopeDto> {
    const filters = new ObjectFiltersDto({
      collectionId,
      addedAfter,
      limit,
      match,
    });

    const stixObjects: StixObjectPropertiesInterface[] =
      await this.objectsService.findOne(collectionId, objectId, filters);

    if (!stixObjects) {
      throw new TaxiiNotFoundException({
        title: "Envelope Not Found",
        description: `Could not locate object in collection ${collectionId} with id: ${objectId}`,
      });
    }

    // Paginate the array of STIX objects and return the requested page & page count.
    return await this.paginationService.getEnvelope(stixObjects, limit, 0);
    /**
     * NOTE: `next` is hard-coded to zero (0) because (at the time of this writing) the TAXII 2.1 specification did
     * not include a `next` URL filtering query parameter in Section "5.6 Get an Object"
     *
     * See: https://docs.oasis-open.org/cti/taxii/v2.1/csprd02/taxii-v2.1-csprd02.html#_Toc16526041
     */
  }
}
