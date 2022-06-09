import { Test, TestingModule } from '@nestjs/testing';
import { TaxiiLoggerService as Logger } from './taxii-logger.service';

describe('TaxiiLoggerService', () => {
  let service: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Logger],
    }).compile();

    service = module.get<Logger>(Logger);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
