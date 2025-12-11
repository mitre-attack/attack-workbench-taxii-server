import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { closeInMongodConnection, rootMongooseTestModule } from 'src/../test/test.mongoose.module';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { TaxiiConfigModule } from 'src/config';
import { AttackObjectEntity, AttackObjectSchema } from 'src/hydrate/schema';
import { FilterModule } from '../filter/filter.module';
import { ObjectModule } from '../object';
import { PaginationService } from '../pagination';
import { ManifestService } from './manifest.service';

describe('ManifestService', () => {
  let manifestService: ManifestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TaxiiLoggerModule,
        TaxiiConfigModule,
        ObjectModule,
        FilterModule,
        rootMongooseTestModule(),
        MongooseModule.forFeature([{ name: AttackObjectEntity.name, schema: AttackObjectSchema }]),
      ],
      providers: [ManifestService, PaginationService],
    }).compile();

    manifestService = await module.resolve<ManifestService>(ManifestService);
  });

  it('should be defined', async () => {
    expect(manifestService).toBeDefined();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
