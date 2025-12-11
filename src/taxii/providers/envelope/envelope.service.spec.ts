import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { closeInMongodConnection, rootMongooseTestModule } from 'src/../test/test.mongoose.module';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { TaxiiConfigModule } from 'src/config';
import { AttackObjectEntity, AttackObjectSchema } from 'src/hydrate/schema';
import { FilterService } from '../filter';
import { ObjectService } from '../object';
import { ObjectRepository } from '../object/object.repository';
import { PaginationService } from '../pagination';
import { EnvelopeService } from './envelope.service';

describe('EnvelopeService', () => {
  let envelopeService: EnvelopeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TaxiiLoggerModule,
        TaxiiConfigModule,
        rootMongooseTestModule(),
        MongooseModule.forFeature([{ name: AttackObjectEntity.name, schema: AttackObjectSchema }]),
      ],
      providers: [
        EnvelopeService,
        PaginationService,
        ObjectService,
        ObjectRepository,
        FilterService,
      ],
    }).compile();
    envelopeService = await module.resolve<EnvelopeService>(EnvelopeService);
  });

  it('should be defined', async () => {
    expect(envelopeService).toBeDefined();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
