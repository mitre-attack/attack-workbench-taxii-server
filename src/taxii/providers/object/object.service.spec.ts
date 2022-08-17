import { Test } from "@nestjs/testing";
import { FilterModule } from "../filter/filter.module";
import { ObjectService } from "./object.service";
import { ObjectWorkbenchRepository } from "./object.repository";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";
import { StixModule } from "src/stix/stix.module";
import { CacheModule } from "@nestjs/common";
import { TaxiiConfigModule } from "src/config";

it("can create an instance of ObjectService", async () => {
  const module = await Test.createTestingModule({
    imports: [
      TaxiiLoggerModule,
      TaxiiConfigModule,
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
    providers: [ObjectService, ObjectWorkbenchRepository],
  }).compile();

  const objectService = module.get(ObjectService);
  expect(objectService).toBeDefined();
});
