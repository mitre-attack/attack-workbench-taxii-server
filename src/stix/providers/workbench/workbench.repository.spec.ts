import { CacheModule } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { WorkbenchRepository } from "./workbench.repository";
import { HttpModule } from "@nestjs/axios";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";
import { TaxiiConfigModule } from "src/config";

it("can create an instance of WorkbenchRepository", async () => {
  const module = await Test.createTestingModule({
    imports: [
      TaxiiConfigModule,
      TaxiiLoggerModule,
      HttpModule,
      CacheModule.register({
        isGlobal: true,
        ttl: 600,
      }),
    ],
    providers: [WorkbenchRepository],
  }).compile();

  const workbenchRepo = module.get(WorkbenchRepository);
  expect(workbenchRepo).toBeDefined();
});
