import { Test } from "@nestjs/testing";
import { CollectionRepository } from "./collection.repository";
import { TaxiiConfigModule } from "src/config";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from "src/../test/test.mongoose.module";
import { MongooseModule } from "@nestjs/mongoose";
import {
  TaxiiCollection,
  TaxiiCollectionSchema,
} from "src/hydrate/collector/schema";
import { CollectionService } from "./collection.service";

describe("CollectionRepository", () => {
  let collectionRepo: CollectionRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TaxiiLoggerModule,
        TaxiiConfigModule,
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: TaxiiCollection.name, schema: TaxiiCollectionSchema },
        ]),
      ],
      providers: [CollectionService, CollectionRepository],
    }).compile();

    collectionRepo = module.get<CollectionRepository>(CollectionRepository);
  });

  it("should be defined", async () => {
    expect(collectionRepo).toBeDefined();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
