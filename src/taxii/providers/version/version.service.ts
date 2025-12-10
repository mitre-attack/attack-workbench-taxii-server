import { Injectable } from '@nestjs/common';
import { TaxiiNotFoundException } from 'src/common/exceptions';
import { TaxiiLoggerService as Logger } from 'src/common/logger';
import { MatchDto } from 'src/common/models/match/match.dto';
import { ObjectFiltersDto } from '../filter/dto';
import { ObjectService } from '../object';
import { PaginationService } from '../pagination';

// Define a minimal, safe type for STIX objects that guarantees at least one timestamp
type VersionedStixObject = (
  | { modified: string; created?: string }
  | { modified?: string; created: string }
) &
  Record<string, unknown>;

@Injectable()
export class VersionService {
  constructor(
    private readonly logger: Logger,
    private readonly objectService: ObjectService,
    private readonly paginationService: PaginationService,
  ) {
    logger.setContext(VersionService.name);
  }

  async findObjectVersions(
    collectionId: string,
    objectId: string,
    addedAfter?: string,
    limit?: number,
    next?: number,
    matches?: MatchDto[],
  ) {
    const filters = new ObjectFiltersDto({
      collectionId,
      objectId,
      addedAfter,
      limit,
      matches,
    });

    // Hard-code filter DTO to retrieve all available versions of the target object
    // filters.versions = true;

    // Retrieve the STIX object from the connected STIX repository.
    // TODO cast `objects` this to correct type when attack-data-model is integrated

    const objects = await this.objectService.findOne(collectionId, objectId, filters);

    /**
     * Extract the version string of the object(s) that are being requested.
     *
     * NOTE: objectVersions: string[] will either be an array of one object (the latest) or an array of different
     * versions of the same object.
     *
     * The TAXII 2.1 specification states: If a STIX object is not versioned (and therefore does not have a modified
     * timestamp) then this version parameter MUST use the created timestamp. If an object does not have a created
     * or modified timestamp or any other version information that can be used, then the server should use a value
     * for the version that is consistent to the server.
     *
     * This implementation assumes that all STIX objects will properties `modified`, `created`, or both.
     */
    const objectVersions: string[] = (objects as VersionedStixObject[]).map((object) =>
      object.modified
        ? new Date(object.modified).toISOString()
        : new Date(object.created).toISOString(),
    );

    if (!objectVersions) {
      throw new TaxiiNotFoundException({
        title: 'Requested STIX ID not found',
        description: `A STIX object with ${objectId} could not be found in collection ${collectionId}.`,
      });
    }
    return await this.paginationService.getVersion(objectVersions, limit, next);
  }
}
