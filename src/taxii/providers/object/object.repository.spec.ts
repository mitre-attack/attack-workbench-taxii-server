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

  function attackObject(
    stixId: string,
    release: string,
    modified: string,
    createdAt: string,
  ): object {
    return {
      stix: {
        id: stixId,
        type: 'attack-pattern',
        created: new Date('2024-01-01T00:00:00.000Z'),
        modified: new Date(modified),
      },
      _meta: {
        collectionRef: {
          id: collectionId,
          title: 'Enterprise ATT&CK',
          version: release,
          modified: new Date('2025-11-01T00:00:00.000Z'),
        },
        stixSpecVersion: '2.1',
        createdAt: new Date(createdAt),
      },
    };
  }

  async function collectCollectionObjects(release: string, latestOnly: boolean) {
    const objects = [];

    for await (const attackObject of objectRepository.findByCollectionId(collectionId, release, {
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

  it('should only stream objects belonging to the requested release', async () => {
    await attackObjectsModel.insertMany([
      attackObject(
        'attack-pattern--001',
        '18.0',
        '2024-01-01T00:00:00.000Z',
        '2025-10-01T00:00:00.000Z',
      ),
      attackObject(
        'attack-pattern--001',
        '18.1',
        '2024-02-01T00:00:00.000Z',
        '2025-11-01T00:00:00.000Z',
      ),
      attackObject(
        'attack-pattern--002',
        '18.1',
        '2024-03-01T00:00:00.000Z',
        '2025-11-02T00:00:00.000Z',
      ),
    ]);

    const objects = await collectCollectionObjects('18.1', false);

    expect(objects).toHaveLength(2);
    expect(objects.map((object) => object.id)).toEqual([
      'attack-pattern--001',
      'attack-pattern--002',
    ]);
    expect(
      objects.find((object) => object.id === 'attack-pattern--001').modified.toISOString(),
    ).toEqual('2024-02-01T00:00:00.000Z');
  });

  it('should stream only the newest version of each object when latestOnly is enabled', async () => {
    await attackObjectsModel.insertMany([
      // Two versions of the same object within the same release
      attackObject(
        'attack-pattern--001',
        '18.1',
        '2024-01-15T00:00:00.000Z',
        '2025-11-01T00:00:00.000Z',
      ),
      attackObject(
        'attack-pattern--001',
        '18.1',
        '2024-02-01T00:00:00.000Z',
        '2025-11-01T00:00:00.000Z',
      ),
      attackObject(
        'attack-pattern--002',
        '18.1',
        '2024-03-01T00:00:00.000Z',
        '2025-11-02T00:00:00.000Z',
      ),
      // A different release of the same collection; must not leak into the response
      attackObject(
        'attack-pattern--003',
        '18.0',
        '2024-04-01T00:00:00.000Z',
        '2025-10-01T00:00:00.000Z',
      ),
    ]);

    const objects = await collectCollectionObjects('18.1', true);

    expect(objects).toHaveLength(2);
    expect(objects.map((object) => object.id)).toEqual([
      'attack-pattern--001',
      'attack-pattern--002',
    ]);
    expect(
      objects.find((object) => object.id === 'attack-pattern--001').modified.toISOString(),
    ).toEqual('2024-02-01T00:00:00.000Z');
  });

  it('should stream all object versions of the release when latestOnly is disabled', async () => {
    await attackObjectsModel.insertMany([
      attackObject(
        'attack-pattern--001',
        '18.1',
        '2024-01-15T00:00:00.000Z',
        '2025-11-01T00:00:00.000Z',
      ),
      attackObject(
        'attack-pattern--001',
        '18.1',
        '2024-02-01T00:00:00.000Z',
        '2025-11-02T00:00:00.000Z',
      ),
    ]);

    const objects = await collectCollectionObjects('18.1', false);

    expect(objects).toHaveLength(2);
    expect(objects.map((object) => object.modified.toISOString())).toEqual([
      '2024-01-15T00:00:00.000Z',
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
