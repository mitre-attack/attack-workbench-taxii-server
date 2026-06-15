import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { closeInMongodConnection, rootMongooseTestModule } from 'src/../test/test.mongoose.module';
import { TaxiiNotFoundException } from 'src/common/exceptions';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { TaxiiConfigModule } from 'src/config';
import {
  ReleasePointerDocument,
  ReleasePointerEntity,
  TaxiiCollectionDocument,
  TaxiiCollectionEntity,
} from 'src/hydrate/schema';
import { releaseSegmentToVersion, versionToReleaseSegment } from './constants';
import { ReleaseModule } from './release.module';
import { ReleaseService } from './release.service';

const ENTERPRISE = 'x-mitre-collection--enterprise';
const ICS = 'x-mitre-collection--ics';

function collectionDoc(id: string, title: string, version: string, modified: string): object {
  return {
    id,
    title,
    canRead: true,
    canWrite: false,
    _meta: {
      release: { version, modified: new Date(modified) },
      createdAt: new Date(),
    },
  };
}

describe('ReleaseService', () => {
  let module: TestingModule;
  let releaseService: ReleaseService;
  let collectionModel: Model<TaxiiCollectionDocument>;
  let pointerModel: Model<ReleasePointerDocument>;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TaxiiLoggerModule, TaxiiConfigModule, rootMongooseTestModule(), ReleaseModule],
    }).compile();

    releaseService = await module.resolve(ReleaseService);
    collectionModel = module.get(getModelToken(TaxiiCollectionEntity.name));
    pointerModel = module.get(getModelToken(ReleasePointerEntity.name));

    await collectionModel.insertMany([
      collectionDoc(ENTERPRISE, 'Enterprise ATT&CK', '9.0', '2021-04-29T14:49:39.188Z'),
      collectionDoc(ENTERPRISE, 'Enterprise ATT&CK', '19.1', '2026-05-12T14:00:00.188Z'),
      collectionDoc(ICS, 'ICS ATT&CK', '19.1', '2026-05-12T14:00:00.188Z'),
    ]);
    await pointerModel.create({
      collectionId: ENTERPRISE,
      version: '19.1',
      modified: new Date('2026-05-12T14:00:00.188Z'),
      updatedAt: new Date(),
    });
  });

  afterEach(async () => {
    await module?.close();
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  it('lists hydrated releases deduplicated across collections, oldest first', async () => {
    const releases = await releaseService.listReleases();
    expect(releases.map((release) => release.version)).toEqual(['9.0', '19.1']);
  });

  it('reports whether a release exists', async () => {
    expect(await releaseService.releaseExists('19.1')).toBe(true);
    expect(await releaseService.releaseExists('1.0')).toBe(false);
  });

  it('resolves the latest release of a collection through its pointer', async () => {
    expect(await releaseService.resolveLatestVersion(ENTERPRISE)).toBe('19.1');
  });

  it('throws TaxiiNotFoundException for a collection without a pointer', async () => {
    await expect(releaseService.resolveLatestVersion('x-mitre-collection--nope')).rejects.toThrow(
      TaxiiNotFoundException,
    );
  });

  describe('release URL segment mapping', () => {
    it('maps segments to versions and back', () => {
      expect(releaseSegmentToVersion('attack-19.1')).toBe('19.1');
      expect(releaseSegmentToVersion('attack-8.0')).toBe('8.0');
      expect(versionToReleaseSegment('19.1')).toBe('attack-19.1');
    });

    it('rejects segments that do not denote a release', () => {
      expect(releaseSegmentToVersion('collections')).toBeUndefined();
      expect(releaseSegmentToVersion('attack-19')).toBeUndefined();
      expect(releaseSegmentToVersion('attack-')).toBeUndefined();
      expect(releaseSegmentToVersion('19.1')).toBeUndefined();
      expect(releaseSegmentToVersion('status-id-123')).toBeUndefined();
    });
  });
});
