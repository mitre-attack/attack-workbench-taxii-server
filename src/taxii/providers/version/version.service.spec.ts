import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { closeInMongodConnection, rootMongooseTestModule } from 'src/../test/test.mongoose.module';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { TaxiiConfigModule } from 'src/config';
import { AttackObjectEntity, AttackObjectSchema } from 'src/hydrate/schema';
import { ObjectModule } from '../object';
import { PaginationService } from '../pagination';
import { VersionService } from './version.service';

describe('VersionService', () => {
  let versionService: VersionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TaxiiLoggerModule,
        TaxiiConfigModule,
        ObjectModule,
        rootMongooseTestModule(),
        MongooseModule.forFeature([{ name: AttackObjectEntity.name, schema: AttackObjectSchema }]),
      ],
      providers: [VersionService, PaginationService],
    }).compile();

    versionService = await module.resolve<VersionService>(VersionService);
  });

  it('should be defined', () => {
    expect(versionService).toBeDefined();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
