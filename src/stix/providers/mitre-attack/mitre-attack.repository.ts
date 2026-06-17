import { HttpService } from '@nestjs/axios';
import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import { lastValueFrom, map } from 'rxjs';
import {
  TaxiiBadRequestException,
  TaxiiNotFoundException,
  TaxiiServiceUnavailableException,
} from 'src/common/exceptions';
import { DEFAULT_ATTACK_STIX_DATA_URL, MITRE_ATTACK_OPTIONS } from 'src/stix/constants';
import { AttackObjectDto } from 'src/stix/dto/attack-object.dto';
import { StixBundleDto } from 'src/stix/dto/stix-bundle.dto';
import { WorkbenchCollectionBundleDto } from 'src/stix/dto/workbench-collection-bundle.dto';
import { WorkbenchCollectionDto } from 'src/stix/dto/workbench-collection.dto';
import { MitreAttackConnectOptionsInterface } from 'src/stix/interfaces/mitre-attack-connect-options.interface';
import { StixRepositoryInterface } from '../stix.repository.interface';
import { CollectionIndex, CollectionIndexCollection } from './collection-index.interface';

const DEFAULT_CACHE_TTL_MS = 600_000; // 10 minutes

const SUPPORTED_DOMAINS = ['enterprise-attack', 'mobile-attack', 'ics-attack'];

interface CacheEntry {
  expiresAt: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

/**
 * A STIX repository/DAO that hydrates the TAXII server from the official MITRE ATT&CK STIX 2.1
 * releases published on GitHub (github.com/mitre-attack/attack-stix-data) rather than from a live
 * ATT&CK Workbench instance.
 *
 * The repository is driven entirely by the collection index (index.json) published at the root of
 * the attack-stix-data repository. The index documents, in one place, every STIX bundle that is
 * available as a distinct ATT&CK release, organized by collection (one collection per ATT&CK
 * domain: enterprise-attack, mobile-attack, and ics-attack).
 *
 * Because ATT&CK releases are immutable once published, fetched resources are cached in memory for
 * a configurable TTL to avoid re-downloading multi-megabyte bundles on every hydration pass.
 */
@Injectable()
export class MitreAttackRepository implements StixRepositoryInterface {
  private readonly baseUrl: string;
  private readonly cacheTtlMs: number;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    private readonly httpService: HttpService,
    private readonly logger: ConsoleLogger,
    @Inject(MITRE_ATTACK_OPTIONS)
    private readonly options: MitreAttackConnectOptionsInterface,
  ) {
    // Strip any trailing slash so URL construction is predictable
    this.baseUrl = (options.baseUrl || DEFAULT_ATTACK_STIX_DATA_URL).replace(/\/+$/, '');
    this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  }

  /**
   * Utility function that handles all GET requests to GitHub. Responses are cached in memory for
   * `cacheTtlMs` milliseconds.
   * @param url Fully-qualified URL of the target resource
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async fetchHttp(url: string): Promise<any> {
    const cached = this.cache.get(url);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`Returning cached response for ${url}`, this.constructor.name);
      return cached.data;
    }
    this.cache.delete(url);

    this.logger.debug(`Sending HTTP GET request to ${url}`, this.constructor.name);

    let data;
    try {
      await lastValueFrom(
        this.httpService.get(url).pipe(
          map((resp) => resp.data),
          map((resp) => (data = resp)),
        ),
      );

      this.logger.debug(`Response received from ${url}`, this.constructor.name);
      this.cache.set(url, { expiresAt: Date.now() + this.cacheTtlMs, data });
      return data;
    } catch (err) {
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        this.logger.error(
          `A request was made to ${url} but the server responded with status code ${err.response.status}`,
          this.constructor.name,
        );

        if (err.response.status >= 400 && err.response.status <= 499) {
          throw new TaxiiBadRequestException({
            title: 'STIX Objects Not Found',
            description:
              'The TAXII server made a request to the STIX server but the target responded with a 4xx status code. The requested STIX object may not be available. Please verify that your request is correct and contact the TAXII server administrator for help.',
          });
        }

        if (err.response.status >= 500 && err.response.status <= 599) {
          throw new TaxiiServiceUnavailableException({
            title: 'STIX Objects Not Found',
            description:
              'The TAXII server made a request to the STIX server but the target responded with a 5xx status code. The STIX server may be temporarily unavailable. Please contact the TAXII server administrator and/or try again later.',
          });
        }
      } else if (err.request) {
        this.logger.error(
          `A request was made to ${url} but no response was received`,
          this.constructor.name,
        );
        this.logger.error(err, this.constructor.name);

        throw new TaxiiServiceUnavailableException({
          title: 'STIX Objects Not Found',
          description:
            'The TAXII server made a request to the STIX server but no response was received. Please contact the TAXII server administrator and/or try again later.',
        });
      } else {
        // Something happened in setting up the request that triggered an Error
        this.logger.error(
          `Something happened in setting up the request to ${url} that triggered Error: ${err.message}`,
          this.constructor.name,
        );

        throw new TaxiiNotFoundException({
          title: 'STIX Objects Not Found',
          description:
            'Something happened while setting up the HTTP request to the STIX server. Please contact the TAXII server administrator.',
        });
      }
    }
  }

  /**
   * Retrieves the ATT&CK collection index (index.json), which documents every available STIX
   * bundle that is available as a distinct ATT&CK release.
   * @private
   */
  private async getCollectionIndex(): Promise<CollectionIndex> {
    const index: CollectionIndex = await this.fetchHttp(`${this.baseUrl}/index.json`);

    if (!index || !Array.isArray(index.collections)) {
      throw new TaxiiNotFoundException({
        title: 'ATT&CK Collection Index Not Found',
        description: `The resource located at ${this.baseUrl}/index.json is not a valid ATT&CK collection index. Please contact the TAXII server administrator.`,
      });
    }

    return index;
  }

  /**
   * Locates a collection in the index by its STIX identifier (e.g. "x-mitre-collection--...").
   * @private
   */
  private async findCollectionById(collectionId: string): Promise<CollectionIndexCollection> {
    const index = await this.getCollectionIndex();
    const collection = index.collections.find((elem) => elem.id === collectionId);

    if (!collection) {
      throw new TaxiiNotFoundException({
        title: 'Collection Not Found',
        description: `The ATT&CK collection index does not contain a collection with identifier '${collectionId}'.`,
      });
    }

    return collection;
  }

  /**
   * Synthesizes an x-mitre-collection STIX object from collection index metadata. The resultant
   * object is shaped identically to the collection objects returned by the Workbench REST API, so
   * consuming services (e.g. HydrateService) can treat both sources interchangeably.
   * @private
   */
  private toCollectionDto(
    collection: CollectionIndexCollection,
    version: { version: string; modified: string },
  ): WorkbenchCollectionDto {
    return new WorkbenchCollectionDto({
      type: 'x-mitre-collection',
      spec_version: '2.1',
      id: collection.id,
      name: collection.name,
      description: collection.description,
      created: collection.created,
      modified: version.modified,
      x_mitre_version: version.version,
      // The MITRE Corporation identity, which authors every published ATT&CK collection
      created_by_ref: 'identity--c78cb6e5-0c4b-4611-8297-d1b8b55e40b5',
      // Not documented in the collection index; only available inside the release bundle itself
      x_mitre_attack_spec_version: undefined,
    });
  }

  /**
   * Wraps a raw STIX object in the same { stix: ... } envelope that Workbench returns so that
   * consuming services can treat both sources interchangeably.
   * @private
   */
  private toAttackObjectDto(stixObject: { [key: string]: unknown }): AttackObjectDto {
    const dto = new AttackObjectDto();
    dto.stix = stixObject;
    return dto;
  }

  /**
   * Returns the most recently published release of the specified collection.
   * @private
   */
  private latestVersion(collection: CollectionIndexCollection) {
    if (!collection.versions || collection.versions.length === 0) {
      throw new TaxiiNotFoundException({
        title: 'Collection Not Found',
        description: `The ATT&CK collection '${collection.id}' does not contain any published releases.`,
      });
    }
    // The publisher sorts versions newest-first, but sort defensively rather than rely on it
    return [...collection.versions].sort(
      (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime(),
    )[0];
  }

  /****************************************
   * PUBLIC METHODS:
   ***************************************/

  /**
   * Retrieves a STIX bundle containing all STIX objects for a specified ATT&CK domain. The bundle
   * corresponds to the latest published ATT&CK release.
   *
   * @param domain The ATT&CK domain to retrieve ("enterprise-attack", "mobile-attack", or "ics-attack").
   * @param version The STIX specification version. Only "2.1" is supported; attack-stix-data
   *                exclusively hosts STIX 2.1 content.
   * @returns The STIX bundle for the specified domain.
   */
  async getStixBundle(domain: string, version: '2.0' | '2.1'): Promise<StixBundleDto> {
    if (!SUPPORTED_DOMAINS.includes(domain)) {
      throw new Error(
        `Invalid domain specified: ${domain}. Supported domains are: ${SUPPORTED_DOMAINS.join(', ')}`,
      );
    }

    if (version !== '2.1') {
      throw new TaxiiNotFoundException({
        title: 'STIX Bundle Not Found',
        description:
          'The MITRE ATT&CK GitHub repository (attack-stix-data) exclusively hosts STIX 2.1 content. STIX 2.0 bundles are not available from this STIX data source.',
      });
    }

    // Each domain folder contains one non-versioned bundle (e.g., enterprise-attack.json) which
    // always corresponds to the latest ATT&CK release
    return await this.fetchHttp(`${this.baseUrl}/${domain}/${domain}.json`);
  }

  /**
   * Retrieves all STIX objects from the latest release of every collection documented in the
   * ATT&CK collection index.
   * @param _excludeExtraneousValues Has no effect; it exists to satisfy the common repository
   *                                 interface. Objects are returned exactly as published on GitHub.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getAllStixObjects(_excludeExtraneousValues = true): Promise<AttackObjectDto[]> {
    const index = await this.getCollectionIndex();

    const allStixObjects: AttackObjectDto[] = [];
    for (const collection of index.collections) {
      const bundle: WorkbenchCollectionBundleDto = await this.fetchHttp(
        this.latestVersion(collection).url,
      );

      for (const stixObject of bundle.objects ?? []) {
        allStixObjects.push(this.toAttackObjectDto(stixObject));
      }
    }
    return allStixObjects;
  }

  /**
   * Retrieves a list of all available x-mitre-collection objects. One collection object is derived
   * from the collection index for each (collection, release) pair, e.g. Enterprise ATT&CK v19.1.
   * @param collectionId Only return the target collection if specified
   * @param versions Returns only the latest release of each collection if 'latest' (default).
   *                 Returns every published release of each collection if 'all'.
   *
   * NOTE: Unlike WorkbenchRepository, this method defaults to 'latest'. A Workbench instance hosts
   * the collection versions its operators curated (typically just the current one), whereas the
   * ATT&CK collection index documents every release ever published (40+ per domain). Defaulting to
   * 'all' would cause HydrateService - which calls this method with no arguments - to download
   * every historical release bundle on every sync, and (because the index is sorted newest-first)
   * finish with the oldest release marked active.
   */
  async getCollections(
    collectionId?: string,
    versions: 'all' | 'latest' = 'latest',
  ): Promise<WorkbenchCollectionDto[]> {
    const index = await this.getCollectionIndex();

    const collections = collectionId
      ? index.collections.filter((elem) => elem.id === collectionId)
      : index.collections;

    const collectionDtos: WorkbenchCollectionDto[] = [];
    for (const collection of collections) {
      if (versions === 'latest') {
        collectionDtos.push(this.toCollectionDto(collection, this.latestVersion(collection)));
        continue;
      }
      for (const version of collection.versions ?? []) {
        collectionDtos.push(this.toCollectionDto(collection, version));
      }
    }
    return collectionDtos;
  }

  /**
   * Retrieves a STIX bundle containing all STIX objects in the specified collection
   * @param collectionId Identifier of the target collection
   * @param modified The publication timestamp of the desired ATT&CK release. Each release of a
   *                 collection is uniquely identified by its modified timestamp in the collection
   *                 index. Defaults to the latest release if omitted.
   */
  async getCollectionBundle(
    collectionId: string,
    modified?: string,
  ): Promise<WorkbenchCollectionBundleDto> {
    const collection = await this.findCollectionById(collectionId);

    let version = this.latestVersion(collection);
    if (modified) {
      const matchingVersion = collection.versions.find(
        (elem) => new Date(elem.modified).getTime() === new Date(modified).getTime(),
      );
      if (!matchingVersion) {
        throw new TaxiiNotFoundException({
          title: 'Collection Bundle Not Found',
          description: `The ATT&CK collection '${collectionId}' does not contain a release with modified timestamp '${modified}'.`,
        });
      }
      version = matchingVersion;
    }

    return await this.fetchHttp(version.url);
  }

  /**
   * Retrieves a single STIX object from the latest release of the specified collection.
   * @param collectionId Identifier of the collection to which the target object belongs
   * @param stixId Identifier of the target object
   * @param versions ATT&CK release bundles contain exactly one (the latest) version of each STIX
   *                 object, so this parameter has no effect; it exists to satisfy the common
   *                 repository interface. Historical object versions live in older release bundles.
   */
  async getAnObject(
    collectionId: string,
    stixId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    versions = false,
  ): Promise<AttackObjectDto[]> {
    const collection = await this.findCollectionById(collectionId);

    const bundle: WorkbenchCollectionBundleDto = await this.fetchHttp(
      this.latestVersion(collection).url,
    );

    const matches = (bundle.objects ?? []).filter((stixObject) => stixObject.id === stixId);
    if (matches.length === 0) {
      return;
    }

    return matches.map((stixObject) => this.toAttackObjectDto(stixObject));
  }
}
