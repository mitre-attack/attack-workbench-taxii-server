import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { closeInMongodConnection, rootMongooseTestModule } from 'src/../test/test.mongoose.module';
import { STIX_REPO_TOKEN } from 'src/stix/constants';
import { WorkbenchCollectionDto } from 'src/stix/dto/workbench-collection.dto';
import { HYDRATE_OPTIONS_TOKEN } from './constants';
import { HydrateService } from './hydrate.service';
import {
  AttackObjectDocument,
  AttackObjectEntity,
  AttackObjectSchema,
  ReleasePointerDocument,
  ReleasePointerEntity,
  ReleasePointerSchema,
  TaxiiCollectionDocument,
  TaxiiCollectionEntity,
  TaxiiCollectionSchema,
} from './schema';

const COLLECTION_ID = 'x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019';

function sourceCollection(version: string, modified: string): WorkbenchCollectionDto {
  return new WorkbenchCollectionDto({
    type: 'x-mitre-collection',
    spec_version: '2.1',
    id: COLLECTION_ID,
    name: 'Enterprise ATT&CK',
    description: 'ATT&CK for Enterprise',
    created: '2018-01-17T12:56:55.080Z',
    modified,
    x_mitre_version: version,
    x_mitre_attack_spec_version: '3.3.0',
    created_by_ref: 'identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5',
  });
}

function bundleFor(version: string) {
  return {
    type: 'bundle',
    id: `bundle--${version}`,
    objects: [
      {
        id: 'attack-pattern--001',
        type: 'attack-pattern',
        modified: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'attack-pattern--002',
        type: 'attack-pattern',
        modified: '2024-02-01T00:00:00.000Z',
      },
    ],
  };
}

describe('HydrateService', () => {
  let module: TestingModule;
  let hydrateService: HydrateService;
  let collectionModel: Model<TaxiiCollectionDocument>;
  let objectModel: Model<AttackObjectDocument>;
  let pointerModel: Model<ReleasePointerDocument>;

  const mockStixRepo = {
    getCollections: jest.fn(),
    getCollectionBundle: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockStixRepo.getCollectionBundle.mockImplementation(async (_id: string, modified: string) =>
      bundleFor(modified),
    );

    module = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: AttackObjectEntity.name, schema: AttackObjectSchema },
          { name: TaxiiCollectionEntity.name, schema: TaxiiCollectionSchema },
          { name: ReleasePointerEntity.name, schema: ReleasePointerSchema },
        ]),
      ],
      providers: [
        HydrateService,
        { provide: STIX_REPO_TOKEN, useValue: mockStixRepo },
        { provide: HYDRATE_OPTIONS_TOKEN, useValue: { hydrateOnBoot: false } },
      ],
    }).compile();

    hydrateService = module.get(HydrateService);
    collectionModel = module.get(getModelToken(TaxiiCollectionEntity.name));
    objectModel = module.get(getModelToken(AttackObjectEntity.name));
    pointerModel = module.get(getModelToken(ReleasePointerEntity.name));
  });

  afterEach(async () => {
    await module?.close();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  it('hydrates every (collection, release) pair advertised by the source', async () => {
    mockStixRepo.getCollections.mockResolvedValue([
      sourceCollection('19.1', '2026-05-12T14:00:00.188Z'),
      sourceCollection('19.0', '2026-04-22T14:00:00.188Z'),
    ]);

    await hydrateService.hydrate();

    expect(await collectionModel.countDocuments()).toBe(2);
    expect(await objectModel.countDocuments()).toBe(4);
    expect(await objectModel.countDocuments({ '_meta.collectionRef.version': '19.1' })).toBe(2);
  });

  it('points the latest-release pointer at the newest release by modified timestamp', async () => {
    // "9.0" > "19.1" lexicographically; the pointer must follow the modified timestamp instead
    mockStixRepo.getCollections.mockResolvedValue([
      sourceCollection('9.0', '2021-04-29T14:49:39.188Z'),
      sourceCollection('19.1', '2026-05-12T14:00:00.188Z'),
    ]);

    await hydrateService.hydrate();

    const pointer = await pointerModel.findOne({ collectionId: COLLECTION_ID });
    expect(pointer.version).toBe('19.1');
  });

  it('skips releases that are already hydrated (additive, immutable releases)', async () => {
    mockStixRepo.getCollections.mockResolvedValue([
      sourceCollection('19.1', '2026-05-12T14:00:00.188Z'),
    ]);

    await hydrateService.hydrate();
    await hydrateService.hydrate();

    expect(mockStixRepo.getCollectionBundle).toHaveBeenCalledTimes(1);
    expect(await collectionModel.countDocuments()).toBe(1);
    expect(await objectModel.countDocuments()).toBe(2);
  });

  it('retries a release whose previous hydration crashed mid-write, without duplicating objects', async () => {
    mockStixRepo.getCollections.mockResolvedValue([
      sourceCollection('19.1', '2026-05-12T14:00:00.188Z'),
    ]);

    // Simulate a crash after objects were written but before the collection doc (commit marker)
    await objectModel.create({
      stix: { id: 'attack-pattern--001', type: 'attack-pattern' },
      _meta: {
        collectionRef: {
          id: COLLECTION_ID,
          title: 'Enterprise ATT&CK',
          version: '19.1',
          modified: new Date('2026-05-12T14:00:00.188Z'),
        },
        stixSpecVersion: '2.1',
        createdAt: new Date(),
      },
    });

    await hydrateService.hydrate();

    expect(mockStixRepo.getCollectionBundle).toHaveBeenCalledTimes(1);
    expect(await collectionModel.countDocuments()).toBe(1);
    // The leftover object was cleaned up; only the bundle's two objects remain
    expect(await objectModel.countDocuments()).toBe(2);
  });

  it("removes legacy collection documents without wiping the live collection's objects", async () => {
    mockStixRepo.getCollections.mockResolvedValue([
      sourceCollection('19.1', '2026-05-12T14:00:00.188Z'),
    ]);
    await hydrateService.hydrate();

    // Seed a pre-per-release-schema collection document for the SAME collection id: version lived
    // under _meta.workbenchCollection, so _meta.release is absent. Inserted via the native driver
    // to bypass the current schema's required-field validation.
    await collectionModel.collection.insertOne({
      id: COLLECTION_ID,
      title: 'Enterprise ATT&CK',
      canRead: true,
      canWrite: false,
      _meta: {
        workbenchCollection: { version: '8.0', modified: new Date('2020-10-27T14:49:39.188Z') },
        active: true,
        createdAt: new Date(),
      },
    });
    expect(await collectionModel.countDocuments()).toBe(2);

    await hydrateService.hydrate();

    // The legacy commit marker is gone, but the live 19.1 release and its objects are untouched -
    // a version-scoped object deletion must not strip the undefined filter and wipe live objects.
    expect(await collectionModel.countDocuments()).toBe(1);
    expect(await collectionModel.countDocuments({ '_meta.release.version': '19.1' })).toBe(1);
    expect(await objectModel.countDocuments({ '_meta.collectionRef.version': '19.1' })).toBe(2);
  });

  it('hard-deletes releases that disappear from the source', async () => {
    mockStixRepo.getCollections.mockResolvedValue([
      sourceCollection('19.0', '2026-04-22T14:00:00.188Z'),
      sourceCollection('19.1', '2026-05-12T14:00:00.188Z'),
    ]);
    await hydrateService.hydrate();

    mockStixRepo.getCollections.mockResolvedValue([
      sourceCollection('19.1', '2026-05-12T14:00:00.188Z'),
    ]);
    await hydrateService.hydrate();

    expect(await collectionModel.countDocuments()).toBe(1);
    expect(await objectModel.countDocuments({ '_meta.collectionRef.version': '19.0' })).toBe(0);
    const pointer = await pointerModel.findOne({ collectionId: COLLECTION_ID });
    expect(pointer.version).toBe('19.1');
  });
});
