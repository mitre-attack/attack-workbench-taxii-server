import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { closeInMongodConnection, rootMongooseTestModule } from 'src/../test/test.mongoose.module';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { TaxiiConfigModule } from 'src/config';
import { AttackObjectDocument, AttackObjectEntity, AttackObjectSchema } from 'src/hydrate/schema';
import { FilterModule } from '../filter/filter.module';
import { ObjectModule } from './object.module';
import { ObjectRepository } from './object.repository';

describe('ObjectRepository', () => {
  let module: TestingModule;
  let objectRepository: ObjectRepository;
  let attackObjectsModel: Model<AttackObjectDocument>;

  const collectionId = 'x-mitre-collection--enterprise-attack';

  async function collectCollectionObjects(latestOnly: boolean) {
    const objects = [];

    for await (const attackObject of objectRepository.findByCollectionId(collectionId, {
      latestOnly,
    })) {
      objects.push({ ...attackObject['_doc'].stix['_doc'] });
    }

    return objects;
  }

  beforeEach(async () => {
    module = await Test.createTestingModule({
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
    attackObjectsModel = module.get<Model<AttackObjectDocument>>(
      getModelToken(AttackObjectEntity.name),
    );
  });

  it('should be defined', async () => {
    expect(objectRepository).toBeDefined();
  });

  it('should stream only the newest active version of each object when latestOnly is enabled', async () => {
    await attackObjectsModel.insertMany([
      {
        stix: {
          id: 'attack-pattern--001',
          type: 'attack-pattern',
          created: new Date('2024-01-01T00:00:00.000Z'),
          modified: new Date('2024-01-01T00:00:00.000Z'),
        },
        _meta: {
          collectionRef: {
            id: collectionId,
            title: 'Enterprise ATT&CK',
            version: '18.0',
            modified: new Date('2025-10-01T00:00:00.000Z'),
          },
          stixSpecVersion: '2.1',
          createdAt: new Date('2025-10-01T00:00:00.000Z'),
          active: true,
        },
      },
      {
        stix: {
          id: 'attack-pattern--001',
          type: 'attack-pattern',
          created: new Date('2024-01-01T00:00:00.000Z'),
          modified: new Date('2024-02-01T00:00:00.000Z'),
        },
        _meta: {
          collectionRef: {
            id: collectionId,
            title: 'Enterprise ATT&CK',
            version: '18.1',
            modified: new Date('2025-11-01T00:00:00.000Z'),
          },
          stixSpecVersion: '2.1',
          createdAt: new Date('2025-11-01T00:00:00.000Z'),
          active: true,
        },
      },
      {
        stix: {
          id: 'attack-pattern--002',
          type: 'attack-pattern',
          created: new Date('2024-03-01T00:00:00.000Z'),
          modified: new Date('2024-03-01T00:00:00.000Z'),
        },
        _meta: {
          collectionRef: {
            id: collectionId,
            title: 'Enterprise ATT&CK',
            version: '18.1',
            modified: new Date('2025-11-01T00:00:00.000Z'),
          },
          stixSpecVersion: '2.1',
          createdAt: new Date('2025-11-02T00:00:00.000Z'),
          active: true,
        },
      },
      {
        stix: {
          id: 'attack-pattern--003',
          type: 'attack-pattern',
          created: new Date('2024-04-01T00:00:00.000Z'),
          modified: new Date('2024-04-01T00:00:00.000Z'),
        },
        _meta: {
          collectionRef: {
            id: collectionId,
            title: 'Enterprise ATT&CK',
            version: '18.1',
            modified: new Date('2025-11-01T00:00:00.000Z'),
          },
          stixSpecVersion: '2.1',
          createdAt: new Date('2025-11-03T00:00:00.000Z'),
          active: false,
        },
      },
    ]);

    const objects = await collectCollectionObjects(true);

    expect(objects).toHaveLength(2);
    expect(objects.map((object) => object.id)).toEqual([
      'attack-pattern--001',
      'attack-pattern--002',
    ]);
    expect(
      objects.find((object) => object.id === 'attack-pattern--001').modified.toISOString(),
    ).toEqual('2024-02-01T00:00:00.000Z');
  });

  it('should stream all active versions when latestOnly is disabled', async () => {
    await attackObjectsModel.insertMany([
      {
        stix: {
          id: 'attack-pattern--001',
          type: 'attack-pattern',
          created: new Date('2024-01-01T00:00:00.000Z'),
          modified: new Date('2024-01-01T00:00:00.000Z'),
        },
        _meta: {
          collectionRef: {
            id: collectionId,
            title: 'Enterprise ATT&CK',
            version: '18.0',
            modified: new Date('2025-10-01T00:00:00.000Z'),
          },
          stixSpecVersion: '2.1',
          createdAt: new Date('2025-10-01T00:00:00.000Z'),
          active: true,
        },
      },
      {
        stix: {
          id: 'attack-pattern--001',
          type: 'attack-pattern',
          created: new Date('2024-01-01T00:00:00.000Z'),
          modified: new Date('2024-02-01T00:00:00.000Z'),
        },
        _meta: {
          collectionRef: {
            id: collectionId,
            title: 'Enterprise ATT&CK',
            version: '18.1',
            modified: new Date('2025-11-01T00:00:00.000Z'),
          },
          stixSpecVersion: '2.1',
          createdAt: new Date('2025-11-01T00:00:00.000Z'),
          active: true,
        },
      },
    ]);

    const objects = await collectCollectionObjects(false);

    expect(objects).toHaveLength(2);
    expect(objects.map((object) => object.modified.toISOString())).toEqual([
      '2024-01-01T00:00:00.000Z',
      '2024-02-01T00:00:00.000Z',
    ]);
  });

  afterEach(async () => {
    await attackObjectsModel?.deleteMany({}).exec();
    await module?.close();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});
