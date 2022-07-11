import { Test } from "@nestjs/testing";
import { PaginationService } from "../pagination";
import { ObjectModule } from "../object";
import { VersionService } from "./version.service";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";
import { TaxiiConfigModule } from "src/config";
import { CacheModule } from "@nestjs/common";
import { StixModule } from "src/stix/stix.module";

it("can create an instance of VersionService", async () => {
  const module = await Test.createTestingModule({
    imports: [
      TaxiiLoggerModule,
      TaxiiConfigModule,
      ObjectModule,
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
    providers: [VersionService, PaginationService],
  }).compile();

  const versionService = module.get(VersionService);
  expect(versionService).toBeDefined();
});
