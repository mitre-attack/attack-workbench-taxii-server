import { Test } from "@nestjs/testing";
import { StixModule } from "src/stix/stix.module";
import { CollectionRepository } from "./collection.repository";
import { TaxiiConfigModule } from "src/config";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";
import { CacheModule } from "@nestjs/common";

it("can create an instance of CollectionRepository", async () => {
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
    providers: [CollectionRepository],
  }).compile();

  const collectionRepo = module.get(CollectionRepository);
  expect(collectionRepo).toBeDefined();
});
