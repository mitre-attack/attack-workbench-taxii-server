import { Test, TestingModule } from '@nestjs/testing';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { TaxiiConfigModule } from 'src/config';
import { PaginationService } from './pagination.service';

describe('PaginationService', () => {
  let paginationService: PaginationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TaxiiLoggerModule, TaxiiConfigModule],
      providers: [PaginationService],
    }).compile();

    paginationService = await module.resolve<PaginationService>(PaginationService);
  });

  it('should be defined', () => {
    expect(paginationService).toBeDefined();
  });
});
