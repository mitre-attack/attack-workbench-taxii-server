import { Injectable } from "@nestjs/common";
import { CollectionCollectorService } from "./collector/providers/collection-collector.service";
import { ObjectCollectorService } from "./collector/providers/object-collector.service";

@Injectable()
export class HydrateService {
  constructor(
    private readonly collectionCollectorService: CollectionCollectorService,
    private readonly objectCollectorService: ObjectCollectorService
  ) {}

  async hydrate() {
    await this.collectionCollectorService.findAndStoreStixCollections();
    await this.objectCollectorService.findAndStoreStixObjects();
  }
}
