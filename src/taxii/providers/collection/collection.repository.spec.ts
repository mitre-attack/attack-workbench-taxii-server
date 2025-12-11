import { MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { closeInMongodConnection, rootMongooseTestModule } from 'src/../test/test.mongoose.module';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { TaxiiConfigModule } from 'src/config';
import { TaxiiCollectionEntity, TaxiiCollectionSchema } from 'src/hydrate/schema';
import { CollectionRepository } from './collection.repository';
import { CollectionService } from './collection.service';

describe('CollectionRepository', () => {
  let collectionRepo: CollectionRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TaxiiLoggerModule,
        TaxiiConfigModule,
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: TaxiiCollectionEntity.name, schema: TaxiiCollectionSchema },
        ]),
      ],
      providers: [CollectionService, CollectionRepository],
    }).compile();

    collectionRepo = await module.resolve<CollectionRepository>(CollectionRepository);
  });

  it('should be defined', async () => {
    expect(collectionRepo).toBeDefined();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
