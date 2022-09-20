import { Test, TestingModule } from "@nestjs/testing";
import { TaxiiConfigModule } from "src/config";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";
import { DiscoveryService } from "./discovery.service";

describe("DiscoveryService", () => {
  let discoveryService: DiscoveryService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TaxiiConfigModule, TaxiiLoggerModule],
      providers: [DiscoveryService],
    }).compile();

    discoveryService = module.get<DiscoveryService>(DiscoveryService);
  });

  it("should be defined", async () => {
    expect(discoveryService).toBeDefined();
  });
});
