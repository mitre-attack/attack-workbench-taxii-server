import { Test } from "@nestjs/testing";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";
import { ObjectModule } from "../object";
import { ManifestRecordService } from "./manifest-record.service";
import { FilterModule } from "../filter/filter.module";
import { TaxiiConfigModule } from "src/config";
import { CacheModule } from "@nestjs/common";
import { StixModule } from "src/stix/stix.module";
import { ManifestService } from "./manifest.service";
import { PaginationService } from "../pagination";

it("can create an instance of ManifestService", async () => {
  const module = await Test.createTestingModule({
    imports: [
      TaxiiLoggerModule,
      TaxiiConfigModule,
      ObjectModule,
      FilterModule,
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
    ],
    providers: [ManifestRecordService, ManifestService, PaginationService],
  }).compile();

  const manifestService = module.get(ManifestService);
  expect(manifestService).toBeDefined();
});
