import { Test, TestingModule } from "@nestjs/testing";
import { RootController } from "./root.controller";
import { DiscoveryModule } from "src/taxii/providers";
import { TaxiiConfigModule } from "src/config";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";

describe("RootController", () => {
  let controller: RootController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TaxiiConfigModule, TaxiiLoggerModule, DiscoveryModule],
      controllers: [RootController],
    }).compile();

    controller = module.get<RootController>(RootController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
