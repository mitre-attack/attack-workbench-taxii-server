import { Test } from "@nestjs/testing";
import { TaxiiConfigModule } from "src/config";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";
import { DiscoveryService } from "./discovery.service";

it("can create an instance of DiscoveryService", async () => {
  const module = await Test.createTestingModule({
    imports: [TaxiiConfigModule, TaxiiLoggerModule],
    providers: [DiscoveryService],
  }).compile();

  const discoveryService = module.get(DiscoveryService);
  expect(discoveryService).toBeDefined();
});
