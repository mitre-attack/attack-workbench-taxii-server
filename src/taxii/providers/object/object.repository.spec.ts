import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { closeInMongodConnection, rootMongooseTestModule } from 'src/../test/test.mongoose.module';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { TaxiiConfigModule } from 'src/config';
import { AttackObjectEntity, AttackObjectSchema } from 'src/hydrate/schema';
import { TaxiiModule } from 'src/taxii/taxii.module';
import { FilterModule } from '../filter/filter.module';
import { ObjectModule } from './object.module';
import { ObjectRepository } from './object.repository';

describe('ObjectRepository', () => {
  let objectRepository: ObjectRepository;

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
      providers: [ObjectRepository],
    }).compile();

    objectRepository = await module.resolve<ObjectRepository>(ObjectRepository);
  });

  it('should be defined', async () => {
    expect(objectRepository).toBeDefined();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
