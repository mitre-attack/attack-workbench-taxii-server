import { Test, TestingModule } from '@nestjs/testing';
import { TaxiiLoggerModule } from 'src/common/logger/taxii-logger.module';
import { TaxiiConfigModule } from 'src/config';
import { ReleaseService } from '../release';
import { DiscoveryService } from './discovery.service';

describe('DiscoveryService', () => {
  let discoveryService: DiscoveryService;

  const mockReleaseService = {
    listReleases: jest.fn().mockResolvedValue([
      { version: '19.0', modified: new Date('2026-04-22T14:00:00.188Z') },
      { version: '19.1', modified: new Date('2026-05-12T14:00:00.188Z') },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TaxiiConfigModule, TaxiiLoggerModule],
      providers: [DiscoveryService, { provide: ReleaseService, useValue: mockReleaseService }],
    }).compile();

    discoveryService = await module.resolve<DiscoveryService>(DiscoveryService);
  });

  it('should be defined', async () => {
    expect(discoveryService).toBeDefined();
  });

  it('lists the default root plus one pinned root per hydrated release', async () => {
    const discovery = await discoveryService.discover();
    expect(discovery.apiRoots).toHaveLength(3);
    expect(discovery.default).toBe(discovery.apiRoots[0]);
    expect(discovery.apiRoots[1].endsWith('/attack-19.0')).toBe(true);
    expect(discovery.apiRoots[2].endsWith('/attack-19.1')).toBe(true);
  });

  it('describes pinned roots with a release-specific title', () => {
    const apiRoot = discoveryService.findApiRootInformation('19.1');
    expect(apiRoot.title).toContain('19.1');
  });
});
