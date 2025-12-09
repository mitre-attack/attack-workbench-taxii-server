import { Test, TestingModule } from '@nestjs/testing';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { ObjectRepository } from './object.repository';
import { TaxiiConfigModule } from 'src/config';
import { FilterModule } from '../filter/filter.module';
import { ObjectModule } from './object.module';
import { closeInMongodConnection, rootMongooseTestModule } from 'src/../test/test.mongoose.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AttackObjectEntity, AttackObjectSchema } from 'src/hydrate/schema';

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

    objectRepository = module.get<ObjectRepository>(ObjectRepository);
  });

  it('should be defined', async () => {
    expect(objectRepository).toBeDefined();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
