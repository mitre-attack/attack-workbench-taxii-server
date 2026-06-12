import { HttpService } from '@nestjs/axios';
import { ConsoleLogger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import { TaxiiNotFoundException } from 'src/common/exceptions';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { TaxiiLoggerService } from 'src/common/logger/taxii-logger.service';
import { TaxiiConfigModule } from 'src/config';
import { MITRE_ATTACK_OPTIONS } from 'src/stix/constants';
import { MitreAttackRepository } from './mitre-attack.repository';

const BASE_URL = 'https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master';

const mockIndex = {
  id: '10296991-439b-4202-90a3-e38812613ad4',
  name: 'MITRE ATT&CK',
  description:
    'MITRE ATT&CK is a globally-accessible knowledge base of adversary tactics and techniques',
  created: '2018-01-17T12:56:55.080Z',
  modified: '2026-05-12T14:00:00.188Z',
  collections: [
    {
      id: 'x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019',
      name: 'Enterprise ATT&CK',
      description: 'ATT&CK for Enterprise',
      created: '2018-01-17T12:56:55.080Z',
      versions: [
        {
          version: '19.1',
          url: `${BASE_URL}/enterprise-attack/enterprise-attack-19.1.json`,
          modified: '2026-05-12T14:00:00.188Z',
        },
        {
          version: '19.0',
          url: `${BASE_URL}/enterprise-attack/enterprise-attack-19.0.json`,
          modified: '2026-04-22T14:00:00.188Z',
        },
      ],
    },
    {
      id: 'x-mitre-collection--90c00720-636b-4485-b342-8751d232bf09',
      name: 'ICS ATT&CK',
      description: 'ATT&CK for ICS',
      created: '2020-10-27T14:49:39.188Z',
      versions: [
        {
          version: '19.1',
          url: `${BASE_URL}/ics-attack/ics-attack-19.1.json`,
          modified: '2026-05-12T14:00:00.188Z',
        },
      ],
    },
  ],
};

const mockEnterpriseBundle = {
  type: 'bundle',
  id: 'bundle--01a722ee-e571-4f9c-9a6f-c1c0414a5193',
  objects: [
    {
      type: 'attack-pattern',
      id: 'attack-pattern--01a5a209-b94c-450b-b7f9-946497d91055',
      name: 'Windows Management Instrumentation',
      modified: '2025-04-15T19:58:11.000Z',
    },
    {
      type: 'x-mitre-collection',
      id: 'x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019',
      name: 'Enterprise ATT&CK',
      x_mitre_version: '19.1',
    },
  ],
};

describe('MitreAttackRepository', () => {
  let repo: MitreAttackRepository;
  let httpGetMock: jest.Mock;

  beforeEach(async () => {
    httpGetMock = jest.fn((url: string) => {
      if (url === `${BASE_URL}/index.json`) {
        return of({ data: mockIndex });
      }
      if (url.startsWith(`${BASE_URL}/enterprise-attack/`)) {
        return of({ data: mockEnterpriseBundle });
      }
      throw new Error(`Unexpected URL requested: ${url}`);
    });

    const module = await Test.createTestingModule({
      imports: [TaxiiConfigModule, TaxiiLoggerModule],
      providers: [
        MitreAttackRepository,
        { provide: ConsoleLogger, useClass: TaxiiLoggerService },
        { provide: HttpService, useValue: { get: httpGetMock } },
        {
          provide: MITRE_ATTACK_OPTIONS,
          useValue: { baseUrl: BASE_URL },
        },
      ],
    }).compile();

    repo = await module.resolve(MitreAttackRepository);
  });

  it('can create an instance of MitreAttackRepository', () => {
    expect(repo).toBeDefined();
  });

  describe('getCollections', () => {
    it('returns only the latest release of each collection by default', async () => {
      const collections = await repo.getCollections();
      expect(collections).toHaveLength(2);
      expect(collections[0].stix.id).toBe(
        'x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019',
      );
      expect(collections[0].stix.type).toBe('x-mitre-collection');
      expect(collections.map((c) => c.stix.x_mitre_version)).toEqual(['19.1', '19.1']);
    });

    it('returns one collection object per (collection, release) pair when versions=all', async () => {
      const collections = await repo.getCollections(undefined, 'all');
      expect(collections).toHaveLength(3);
      expect(collections[0].stix.x_mitre_version).toBe('19.1');
      expect(collections[1].stix.x_mitre_version).toBe('19.0');
    });

    it('filters by collection identifier', async () => {
      const collections = await repo.getCollections(
        'x-mitre-collection--90c00720-636b-4485-b342-8751d232bf09',
      );
      expect(collections).toHaveLength(1);
      expect(collections[0].stix.name).toBe('ICS ATT&CK');
    });
  });

  describe('getCollectionBundle', () => {
    it('retrieves the latest release bundle when no modified timestamp is specified', async () => {
      const bundle = await repo.getCollectionBundle(
        'x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019',
      );
      expect(bundle.objects).toHaveLength(2);
      expect(httpGetMock).toHaveBeenCalledWith(
        `${BASE_URL}/enterprise-attack/enterprise-attack-19.1.json`,
      );
    });

    it('retrieves the release bundle matching the specified modified timestamp', async () => {
      await repo.getCollectionBundle(
        'x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019',
        '2026-04-22T14:00:00.188Z',
      );
      expect(httpGetMock).toHaveBeenCalledWith(
        `${BASE_URL}/enterprise-attack/enterprise-attack-19.0.json`,
      );
    });

    it('throws TaxiiNotFoundException for an unknown collection', async () => {
      await expect(repo.getCollectionBundle('x-mitre-collection--does-not-exist')).rejects.toThrow(
        TaxiiNotFoundException,
      );
    });

    it('throws TaxiiNotFoundException for an unknown release', async () => {
      await expect(
        repo.getCollectionBundle(
          'x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019',
          '1999-01-01T00:00:00.000Z',
        ),
      ).rejects.toThrow(TaxiiNotFoundException);
    });
  });

  describe('getStixBundle', () => {
    it('retrieves the non-versioned (latest) bundle for the specified domain', async () => {
      const bundle = await repo.getStixBundle('enterprise-attack', '2.1');
      expect(bundle.objects).toHaveLength(2);
      expect(httpGetMock).toHaveBeenCalledWith(
        `${BASE_URL}/enterprise-attack/enterprise-attack.json`,
      );
    });

    it('rejects unsupported domains', async () => {
      await expect(repo.getStixBundle('not-a-domain', '2.1')).rejects.toThrow(
        /Invalid domain specified/,
      );
    });

    it('rejects STIX 2.0 requests', async () => {
      await expect(repo.getStixBundle('enterprise-attack', '2.0')).rejects.toThrow(
        TaxiiNotFoundException,
      );
    });
  });

  describe('getAnObject', () => {
    it('retrieves a single object from the latest release bundle', async () => {
      const objects = await repo.getAnObject(
        'x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019',
        'attack-pattern--01a5a209-b94c-450b-b7f9-946497d91055',
      );
      expect(objects).toHaveLength(1);
      expect(objects[0].stix.name).toBe('Windows Management Instrumentation');
    });

    it('returns undefined when the object does not exist', async () => {
      const objects = await repo.getAnObject(
        'x-mitre-collection--1f5f1533-f617-4ca8-9ab4-6a02367fa019',
        'attack-pattern--does-not-exist',
      );
      expect(objects).toBeUndefined();
    });
  });

  describe('caching', () => {
    it('caches the collection index between calls', async () => {
      await repo.getCollections();
      await repo.getCollections();
      const indexRequests = httpGetMock.mock.calls.filter(
        ([url]) => url === `${BASE_URL}/index.json`,
      );
      expect(indexRequests).toHaveLength(1);
    });
  });
});
