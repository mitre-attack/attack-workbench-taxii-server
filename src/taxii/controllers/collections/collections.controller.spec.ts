import { Test, TestingModule } from "@nestjs/testing";
import { CollectionsController } from "./collections.controller";
import {
  CollectionModule,
  EnvelopeModule,
  ManifestModule,
  VersionModule,
} from "../../providers";
import { CacheModule } from "@nestjs/common";
import { StixModule } from "src/stix/stix.module";
import { TaxiiConfigModule } from "src/config";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";

describe("CollectionsController", () => {
  let controller: CollectionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TaxiiConfigModule,
        TaxiiLoggerModule,
        CacheModule.register({
          isGlobal: true,
          ttl: 600,
        }),
        StixModule.register({
          useType: "workbench",
          workbench: {
            authorization: "fake-api-key",
          },
        }),
        CollectionModule,
        EnvelopeModule,
        ManifestModule,
        VersionModule,
      ],
      controllers: [CollectionsController],
    }).compile();

    controller = module.get<CollectionsController>(CollectionsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
