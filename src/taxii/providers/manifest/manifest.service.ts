import { Injectable } from "@nestjs/common";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { ObjectService } from "../object";
import { ObjectFiltersDto } from "../filter/dto";
import { StixObjectPropertiesInterface } from "src/stix/dto/interfaces/stix-object-properties.interface";
import { MatchDto } from "src/common/models/match/match.dto";
import { ManifestRecordService } from "./manifest-record.service";
import { PaginationService } from "../pagination/pagination.service";
import { ManifestDto } from "./dto";

@Injectable()
export class ManifestService {
  constructor(
    private readonly logger: Logger,
    private readonly objectService: ObjectService,
    private readonly manifestRecordService: ManifestRecordService,
    private readonly paginationService: PaginationService
  ) {
    logger.setContext(ManifestService.name);
  }

  async getManifestsByCollection(
    collectionId: string,
    addedAfter?: string,
    limit?: number,
    next?: number,
    match?: MatchDto
  ): Promise<ManifestDto> {
    const searchFilters = new ObjectFiltersDto({
      collectionId,
      addedAfter,
      limit,
      match,
    });

    // First, get all of the STIX objects. Once acquired, we will paginate them into envelopes.
    const stixObjects: StixObjectPropertiesInterface[] =
      await this.objectService.findByCollection(searchFilters);

    // Convert STIX objects to manifest-records
    const manifestRecords =
      await this.manifestRecordService.objectsToManifestRecords(stixObjects);

    // Paginate the manifest-records and return the appropriate page
    return await this.paginationService.getManifests(
      manifestRecords,
      limit,
      next
    );
  }
}
