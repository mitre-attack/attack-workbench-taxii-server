import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { closeInMongodConnection, rootMongooseTestModule } from 'src/../test/test.mongoose.module';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { TaxiiConfigModule } from 'src/config';
import { AttackObjectEntity, AttackObjectSchema } from 'src/hydrate/schema';
import { FilterModule } from '../filter/filter.module';
import { ObjectModule } from './object.module';
import { ObjectRepository } from './object.repository';
import { ObjectService } from './object.service';

describe('ObjectService', () => {
  let objectService: ObjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TaxiiLoggerModule,
        TaxiiConfigModule,
        FilterModule,
        ObjectModule,
        rootMongooseTestModule(),
        MongooseModule.forFeature([{ name: AttackObjectEntity.name, schema: AttackObjectSchema }]),
      ],
      providers: [ObjectService, ObjectRepository],
    }).compile();

    objectService = await module.resolve(ObjectService);
  });

  it('should be defined', () => {
    expect(objectService).toBeDefined();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
