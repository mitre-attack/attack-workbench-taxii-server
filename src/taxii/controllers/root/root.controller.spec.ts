import { Test, TestingModule } from '@nestjs/testing';
import { closeInMongodConnection, rootMongooseTestModule } from 'src/../test/test.mongoose.module';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { TaxiiConfigModule } from 'src/config';
import { DiscoveryModule } from 'src/taxii/providers';
import { ReleaseModule } from 'src/taxii/providers/release';
import { RootController } from './root.controller';

describe('RootController', () => {
  let controller: RootController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TaxiiConfigModule,
        TaxiiLoggerModule,
        rootMongooseTestModule(),
        DiscoveryModule,
        ReleaseModule,
      ],
      controllers: [RootController],
    }).compile();

    controller = await module.resolve<RootController>(RootController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
