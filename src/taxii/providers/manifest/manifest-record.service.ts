import { CACHE_MANAGER, Inject, Injectable } from "@nestjs/common";
import { Cache } from "cache-manager";
import { TaxiiConfigService } from "src/config";
import { ObjectService } from "../object";
import { StixObjectPropertiesInterface } from "src/stix/dto/interfaces/stix-object-properties.interface";
import { ManifestRecordDto } from "./dto";

@Injectable()
export class ManifestRecordService {
  constructor(
    private readonly objectService: ObjectService,
    private readonly appConfigService: TaxiiConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  async objectsToManifestRecords(stixObjects: StixObjectPropertiesInterface[]) {
    return stixObjects.map((object) => new ManifestRecordDto(object));
  }
}
