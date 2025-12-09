import { Test, TestingModule } from '@nestjs/testing';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { ObjectModule } from '../object';
import { FilterModule } from '../filter/filter.module';
import { TaxiiConfigModule } from 'src/config';
import { ManifestService } from './manifest.service';
import { PaginationService } from '../pagination';
import { closeInMongodConnection, rootMongooseTestModule } from 'src/../test/test.mongoose.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AttackObjectEntity, AttackObjectSchema } from 'src/hydrate/schema';

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

    manifestService = module.get<ManifestService>(ManifestService);
  });

  it('should be defined', async () => {
    expect(manifestService).toBeDefined();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
