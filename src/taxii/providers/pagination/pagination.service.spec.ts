import { Test, TestingModule } from "@nestjs/testing";
import { PaginationService } from "./pagination.service";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";

describe("PaginationService", () => {
  let paginationService: PaginationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TaxiiLoggerModule],
      providers: [PaginationService],
    }).compile();

    paginationService = module.get<PaginationService>(PaginationService);
  });

  it("should be defined", () => {
    expect(paginationService).toBeDefined();
  });
});
