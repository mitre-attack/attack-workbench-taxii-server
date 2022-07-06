import { Test } from "@nestjs/testing";
import { PaginationService } from "./pagination.service";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";

it("can create an instance of PaginationService", async () => {
  const module = await Test.createTestingModule({
    imports: [TaxiiLoggerModule],
    providers: [PaginationService],
  }).compile();
  const paginationService = module.get(PaginationService);
  expect(paginationService).toBeDefined();
});
