import { Test, TestingModule } from '@nestjs/testing';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { TaxiiConfigModule } from 'src/config';
import { DiscoveryModule } from 'src/taxii/providers';
import { RootController } from './root.controller';

describe('RootController', () => {
  let controller: RootController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TaxiiConfigModule, TaxiiLoggerModule, DiscoveryModule],
      controllers: [RootController],
    }).compile();

    controller = await module.resolve<RootController>(RootController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
