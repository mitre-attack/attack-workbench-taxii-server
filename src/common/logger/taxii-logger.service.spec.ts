import { Test, TestingModule } from "@nestjs/testing";
import { TaxiiLoggerService as Logger } from "./taxii-logger.service";
import { TaxiiConfigModule } from "../../config";

describe("TaxiiLoggerService", () => {
  let service: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TaxiiConfigModule],
      providers: [Logger],
    }).compile();

    service = await module.resolve<Logger>(Logger);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
