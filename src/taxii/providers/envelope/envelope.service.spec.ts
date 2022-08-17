import { Test } from "@nestjs/testing";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";
import { TaxiiConfigModule } from "src/config";
import { StixModule } from "src/stix/stix.module";
import { CacheModule } from "@nestjs/common";
import { EnvelopeService } from "./envelope.service";
import { PaginationService } from "../pagination";
import { ObjectService } from "../object";
import { FilterService } from "../filter";
import { ObjectWorkbenchRepository } from "../object/object.repository";

it("can create an instance of EnvelopeService", async () => {
  const module = await Test.createTestingModule({
    imports: [
      TaxiiLoggerModule,
      TaxiiConfigModule,
      // CacheModule used by WorkbenchRepository
      CacheModule.register({
        isGlobal: true,
        ttl: 600,
      }),
      // StixModule is used by CollectionRepository
      StixModule.register({
        useType: "workbench",
        workbench: {
          authorization: "fake-api-key",
          cacheTtl: 500, // default = 500ms
        },
      }),
    ],
    providers: [
      EnvelopeService,
      PaginationService,
      ObjectService,
      ObjectWorkbenchRepository,
      FilterService,
    ],
  }).compile();

  const envelopeService = module.get(EnvelopeService);
  expect(envelopeService).toBeDefined();
});
