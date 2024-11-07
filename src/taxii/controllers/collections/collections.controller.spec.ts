import { Test, TestingModule } from "@nestjs/testing";
import { CollectionsController } from "./collections.controller";
import {
  CollectionModule,
  EnvelopeModule,
  ManifestModule,
  VersionModule,
} from "src/taxii/providers";
import { TaxiiConfigModule } from "src/config";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from "src/../test/test.mongoose.module";
import { MongooseModule } from "@nestjs/mongoose";
import {
  AttackObjectEntity,
  AttackObjectSchema,
  TaxiiCollection,
  TaxiiCollectionSchema,
} from "src/hydrate/collector/schema";

describe("CollectionsController", () => {
  let controller: CollectionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TaxiiConfigModule,
        TaxiiLoggerModule,
        CollectionModule,
        EnvelopeModule,
        ManifestModule,
        VersionModule,
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: AttackObjectEntity.name, schema: AttackObjectSchema },
          { name: TaxiiCollection.name, schema: TaxiiCollectionSchema },
        ]),
      ],
      controllers: [CollectionsController],
    }).compile();

    controller = module.get<CollectionsController>(CollectionsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
