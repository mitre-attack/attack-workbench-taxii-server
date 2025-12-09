import { Injectable } from '@nestjs/common';
import { ObjectService } from '../object';
import { MatchDto } from 'src/common/models/match/match.dto';
import { TaxiiLoggerService as Logger } from 'src/common/logger';
import { ObjectFiltersDto } from '../filter/dto';
import 'object-hash';
import { TaxiiNotFoundException } from 'src/common/exceptions';
import { EnvelopeDto } from './dto';
import { PaginationService } from '../pagination';

@Injectable()
export class EnvelopeService {
  constructor(
    private readonly logger: Logger,
    private readonly objectsService: ObjectService,
    private readonly paginationService: PaginationService,
  ) {
    logger.setContext(EnvelopeService.name);
  }
  /**
   * Returns an envelope containing STIX objects as determined by the search criteria.
   * @param collectionId All returned STIX objects must belong to the specified collection
   * @param addedAfter? All returned STIX objects must have been created before the specified date
   * @param limit? The total number of returned STIX objects must not exceed the pagination limit
   * @param next? Refers to the unique envelope ID. Indicates which envelope should be returned.
   * @param matches? All returned STIX objects must match all of the specified search criteria.
   */
  async findByCollectionId(
    collectionId: string,
    addedAfter?: string,
    limit?: number,
    next?: number,
    matches?: MatchDto[],
  ): Promise<EnvelopeDto> {
    const filters = new ObjectFiltersDto({
      collectionId,
      addedAfter,
      limit,
      matches,
    });

    // First, get all of the STIX objects. Once acquired, we will paginate them into envelopes.
    // TODO cast `objects` this to correct type when attack-data-model is integrated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stixObjects: { [key: string]: any }[] =
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
   * @param next
   * @param matches? Contains object filters such as spec_version and type. See the TAXII 2.1 specification for details.
   */
  async findByObjectId(
    collectionId: string,
    objectId: string,
    addedAfter?: string,
    limit?: number,
    next?: number,
    matches?: MatchDto[],
  ): Promise<EnvelopeDto> {
    const filters = new ObjectFiltersDto({
      collectionId,
      addedAfter,
      limit,
      matches,
    });

    // TODO cast `objects` this to correct type when attack-data-model is integrated
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stixObjects: { [key: string]: any }[] = await this.objectsService.findOne(
      collectionId,
      objectId,
      filters,
    );

    if (!stixObjects) {
      throw new TaxiiNotFoundException({
        title: 'Envelope Not Found',
        description: `Could not locate object in collection ${collectionId} with id: ${objectId}`,
      });
    }

    // Paginate the array of STIX objects and return the requested page & page count.
    return await this.paginationService.getEnvelope(stixObjects, limit, next);
  }
}
