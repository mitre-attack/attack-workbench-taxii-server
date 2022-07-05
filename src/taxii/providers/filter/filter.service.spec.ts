import { Test } from "@nestjs/testing";
import { FilterService } from "./filter.service";
import { TaxiiLoggerModule } from "src/common/logger/taxii-logger.module";

it ("can create an instance of FilterService", async () => {
    const module = await Test.createTestingModule({
        imports: [TaxiiLoggerModule],
        providers: [FilterService]
    }).compile();

    const filterService = module.get(FilterService);
    expect(filterService).toBeDefined();
});