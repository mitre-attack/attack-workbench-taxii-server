import { Test } from "@nestjs/testing";
import { CollectionService } from "./collection.service";
import { CollectionRepository } from "./collection.repository";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";
import { TaxiiConfigModule } from "src/config";
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from "src/../test/test.mongoose.module";
import { MongooseModule } from "@nestjs/mongoose";
import {
  TaxiiCollectionEntity,
  TaxiiCollectionSchema,
} from "src/hydrate/schema";

describe("CollectionService", () => {
  let collectionService: CollectionService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TaxiiLoggerModule,
        TaxiiConfigModule,
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: TaxiiCollectionEntity.name, schema: TaxiiCollectionSchema },
        ]),
      ],
      providers: [CollectionService, CollectionRepository],
    }).compile();

    collectionService = module.get<CollectionService>(CollectionService);
  });

  it("should be defined", async () => {
    expect(collectionService).toBeDefined();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
