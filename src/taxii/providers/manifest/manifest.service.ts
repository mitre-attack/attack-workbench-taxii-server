import { Injectable } from "@nestjs/common";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { ObjectService } from "../object";
import { ObjectFiltersDto } from "../filter/dto";
import { MatchDto } from "src/common/models/match/match.dto";
import { PaginationService } from "../pagination";
import { ManifestDto, ManifestRecordDto } from "./dto";
import { StixObjectDto } from "src/stix/dto/stix-object.dto";

@Injectable()
export class ManifestService {
  constructor(
    private readonly logger: Logger,
    private readonly objectService: ObjectService,
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

    const stixObjects: AsyncIterableIterator<StixObjectDto> =
      await this.objectService.streamByCollectionId(searchFilters);

    // Convert STIX objects to manifest-records

    const manifestRecords: ManifestRecordDto[] = [];

    for await (const object of stixObjects) {
      manifestRecords.push(new ManifestRecordDto(object));
    }

    // Paginate the manifest-records and return the appropriate page

    return await this.paginationService.getManifest(
      manifestRecords,
      limit,
      next
    );
  }
}
