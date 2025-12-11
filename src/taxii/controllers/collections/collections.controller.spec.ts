import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { closeInMongodConnection, rootMongooseTestModule } from 'src/../test/test.mongoose.module';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { TaxiiConfigModule } from 'src/config';
import {
  AttackObjectEntity,
  AttackObjectSchema,
  TaxiiCollectionEntity,
  TaxiiCollectionSchema,
} from 'src/hydrate/schema';
import {
  CollectionModule,
  EnvelopeModule,
  ManifestModule,
  VersionModule,
} from 'src/taxii/providers';
import { TaxiiModule } from 'src/taxii/taxii.module';
import { CollectionsController } from './collections.controller';

describe('CollectionsController', () => {
  let controller: CollectionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TaxiiConfigModule,
        TaxiiLoggerModule,
        CollectionModule,
        EnvelopeModule,
        ManifestModule,
        VersionModule,
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: AttackObjectEntity.name, schema: AttackObjectSchema },
          { name: TaxiiCollectionEntity.name, schema: TaxiiCollectionSchema },
        ]),
      ],
      controllers: [CollectionsController],
    }).compile();

    controller = await module
      .resolve(CollectionsController);
    
    });
    
    
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
