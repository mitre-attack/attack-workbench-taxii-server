import { Test, TestingModule } from "@nestjs/testing";
import { FilterService } from "./filter.service";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";

describe("FilterService", () => {
  let filterService: FilterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TaxiiLoggerModule],
      providers: [FilterService],
    }).compile();

    filterService = module.get<FilterService>(FilterService);
  });

  it("should be defined", async () => {
    expect(filterService).toBeDefined();
  });
});
