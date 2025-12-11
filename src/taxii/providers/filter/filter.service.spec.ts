import { Test, TestingModule } from '@nestjs/testing';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { TaxiiConfigModule } from 'src/config';
import { FilterService } from './filter.service';

describe('FilterService', () => {
  let filterService: FilterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TaxiiLoggerModule, TaxiiConfigModule],
      providers: [FilterService],
    }).compile();

    filterService = await module.resolve<FilterService>(FilterService);
  });

  it('should be defined', async () => {
    expect(filterService).toBeDefined();
  });
});
