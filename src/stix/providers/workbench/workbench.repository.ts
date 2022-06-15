import { CACHE_MANAGER, Inject, Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom, map } from "rxjs";
import {
  TaxiiBadRequestException,
  TaxiiNotFoundException,
  TaxiiServiceUnavailableException,
} from "src/common/exceptions";
import { TaxiiLoggerService as Logger } from "src/common/logger";
import { Cache } from "cache-manager";
import { TaxiiConfigService } from "src/config";
import { WorkbenchCollectionDto } from "./dto/workbench-collection.dto";
import { plainToClass, plainToInstance } from "class-transformer";
import { StixRepositoryInterface } from "../stix.repository.interface";
import { StixRepositoryAbstract } from "../stix.repository.abstract";
import { WorkbenchCollectionBundleDto } from "./dto/workbench-collection-bundle.dto";
import { WorkbenchStixObjectDto } from "./dto/workbench-stix-object.dto";
import { StixIdentityPrefix, WorkbenchRESTEndpoint } from "./constants";

@Injectable()
export class WorkbenchRepository
  extends StixRepositoryAbstract
  implements StixRepositoryInterface
{
  private readonly _baseUrl: string;
  private readonly _cacheTtl: number;

  constructor(
    private readonly logger: Logger,
    private readonly httpService: HttpService,
    private readonly config: TaxiiConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {
    super();
    this._baseUrl = config.WORKBENCH_REST_API_URL;
    this._cacheTtl = config.CACHE_TTL;
    logger.setContext(WorkbenchRepository.name);
  }

  /**
   * Utility function to cache Workbench responses
   * @param key Keys will always be the full Workbench REST API endpoint (URL) that generated the response
   * @param item The entire HTTP response retrieved from the connected Workbench REST API
   * @private
   */
  private async addToCache(key: string, item: any): Promise<void> {
    return await this.cacheManager.set(key, item, { ttl: this._cacheTtl });
  }

  /**
   * Utility function to retrieve cached responses from the cache
   * @param key Index by which cached responses are retrieved. Keys will always be the full Workbench REST API
   *            endpoint (URL) that generated the response
   * @private
   */
  private async getFromCache(key: string): Promise<any> {
    return await this.cacheManager.get(key);
  }

  /**
   * Utility function that handles all GET requests to the Workbench instance
   * @param url Base URL of the target Workbench REST API instance
   * @private
   */
  private async fetchHttp(url: string): Promise<any> {
    this.logger.debug(
      `Sending HTTP GET request to ${url}`,
      this.constructor.name
    );

    let data;
    try {
      // send request to workbench, store the response data in a StixBundleDto, and return it
      await lastValueFrom(
        this.httpService.get(url).pipe(
          map((resp) => resp.data),
          map((resp) => (data = resp))
        )
      );

      this.logger.debug(`Response received from ${url}`, this.constructor.name);
      return data;
    } catch (err) {
      // error likely thrown due to network connection issue between TAXII server and Workbench REST API

      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        this.logger.error(
          `A request was made to ${url} but the server responded with status code ${err.response.status}`,
          this.constructor.name
        );

        if (err.response.status >= 400 && err.response.status <= 499) {
          throw new TaxiiBadRequestException({
            title: "STIX Objects Not Found",
            description:
              "The TAXII server made a request to the STIX server but the target responded with a 4xx status code. The requested STIX object may not be available. Please verify that your request is correct and contact the TAXII server administrator for help.",
          });
        }

        if (err.response.status >= 500 && err.response.status <= 599) {
          throw new TaxiiServiceUnavailableException({
            title: "STIX Objects Not Found",
            description:
              "The TAXII server made a request to the STIX server but the target responded with a 5xx status code. The STIX server may be temporarily unavailable. Please contact the TAXII server administrator and/or try again later.",
          });
        }
      } else if (err.request) {
        this.logger.error(
          `A request was made to ${url} but no response was received`,
          this.constructor.name
        );
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        this.logger.error(err, this.constructor.name);

        throw new TaxiiServiceUnavailableException({
          title: "STIX Objects Not Found",
          description:
            "The TAXII server made a request to the STIX server but no response was received. Please contact the TAXII server administrator and/or try again later.",
        });
      } else {
        // Something happened in setting up the request that triggered an Error
        this.logger.error(
          `Something happened in setting up the request to ${url} that triggered Error: ${err.message}`,
          this.constructor.name
        );

        throw new TaxiiNotFoundException({
          title: "STIX Objects Not Found",
          description:
            "Something happened while setting up the HTTP request to the STIX server. Please contact the TAXII server administrator.",
        });
      }
    }
  }

  /****************************************
   * PUBLIC METHODS:
   ***************************************/

  /**
   * Retrieves a list of all available STIX objects
   */
  async getAllStixObjects(): Promise<WorkbenchStixObjectDto[]> {
    const url = `${this._baseUrl}/api/attack-objects`;
    let response: Array<WorkbenchStixObjectDto>;
    response = await this.getFromCache(url); // TODO deserialize first i.e., run the WB response through plainToInstance
    if (response) {
      return response;
    }
    // Get all STIX objects from Workbench. The expected response body contains an array of STIX objects.
    response = await this.fetchHttp(url);
    // Deserialize the response, i.e., convert the response array of JSON objects to an array of
    // WorkbenchStixObjectDto instances
    const allStixObjects = [];
    response.forEach((elem) => {
      allStixObjects.push(
        // Transform each plain JSON object returned from Workbench to an instance of WorkbenchStixObjectDto
        // and remove any extraneous/untagged properties. In this case, class-transformer will validate the
        // 'stix' property because it is tagged with @Type(() => WorkbenchStixObjectPropertiesDto)).
        // This tells Nest to additionally validate the properties contained with the stix object/property.
        // WorkbenchStixObjectPropertiesDto also contains properties tagged with class-transformer decorators.
        // Any given class-transformer decorators serves one of two purposes:
        //      (1) validate that the property values conform to the expected value (e.g., the stix.id property
        //      is tagged with @IsUUID(), which instructs the transpiler to ensure that the value of stix.id is
        //      a string and a valid UUID (version 3, 4 or 5).
        //
        //      (2) transform the property from plain JSON objects to an instance of the specified DTO class.
        //      (e.g., the stix.created property is converted from a string to an instance of TimestampDto.
        plainToInstance(WorkbenchStixObjectDto, elem, {
          excludeExtraneousValues: true,
        })
      );
    });
    // Cache the response by URL then return
    await this.addToCache(url, allStixObjects);
    return allStixObjects;
  }

  /**
   * Retrieves a list of all available x-mitre-collection objects
   * @param collectionId Only return the target collection if specified
   */
  async getCollections(
    collectionId?: string
  ): Promise<WorkbenchCollectionDto[]> {
    let url = `${this._baseUrl}/api/collections/`;
    if (collectionId) {
      url += collectionId;
    }

    // Fetch the data from either the cache (in the case of a cache hit) or Workbench (cache miss)
    let response: Array<WorkbenchStixObjectDto>;
    response = await this.getFromCache(url);
    if (response) {
      return response;
    }
    response = await this.fetchHttp(url);

    // Deserialize the response data into Array<WorkbenchCollectionDto>
    const collections: WorkbenchCollectionDto[] = [];

    /**
     * Each object in the array is transformed into a WorkbenchCollectionDto and then pushed to the
     * StixCollectionsDto (plural) object.
     */
    response.forEach((collection) => {
      // const wbCollection = new WorkbenchCollectionDto(collection);
      const wbCollection = plainToClass(WorkbenchCollectionDto, collection, {
        excludeExtraneousValues: true,
      });
      collections.push(wbCollection);
    });
    await this.addToCache(url, collections);
    return collections;
  }

  /**
   * Retrieves a STIX bundle containing all STIX object in the specified collection
   * @param collectionId Identifier of the target collection
   */
  async getCollectionBundle(
    collectionId: string
  ): Promise<WorkbenchCollectionBundleDto> {
    const url = `${this._baseUrl}/api/collection-bundles?collectionId=${collectionId}`;

    // Fetch the data from either the cache (in the case of a cache hit) or Workbench (cache miss)
    let response: WorkbenchCollectionBundleDto;
    response = await this.getFromCache(url);
    if (response) {
      // cache hit - return the cached data
      return response;
    }
    // cache miss - get the data from workbench
    response = await this.fetchHttp(url);

    // Deserialize the response body
    const collectionBundle: WorkbenchCollectionBundleDto = plainToInstance(
      WorkbenchCollectionBundleDto,
      response,
      { excludeExtraneousValues: true }
    );

    // Cache the response by URL then return
    await this.addToCache(url, collectionBundle);
    return collectionBundle;
  }

  /**
   * Retrieves a single STIX object. Optionally supports retrieving multiple versions of the STIX object.
   * @param collectionId Identifier of the collection to which the target object belongs
   * @param stixId Identifier of the target object
   * @param versions Returns only the latest version of the object if false (default). Returns all available versions
   *                 of the object if true.
   */
  async getAnObject(
    collectionId: string,
    stixId: string,
    versions = false
  ): Promise<WorkbenchStixObjectDto[]> {
    let url = `${this._baseUrl}`;
    const prefix = stixId.split("--")[0];
    switch (prefix) {
      case StixIdentityPrefix.ATTACK_PATTERN: {
        url += WorkbenchRESTEndpoint.ATTACK_PATTERN;
        break;
      }
      case StixIdentityPrefix.TACTIC: {
        url += WorkbenchRESTEndpoint.TACTIC;
        break;
      }
      case StixIdentityPrefix.MALWARE: {
        url += WorkbenchRESTEndpoint.MALWARE;
        break;
      }
      case StixIdentityPrefix.TOOL: {
        url += WorkbenchRESTEndpoint.TOOL;
        break;
      }
      case StixIdentityPrefix.GROUP: {
        url += WorkbenchRESTEndpoint.GROUP;
        break;
      }
      case StixIdentityPrefix.MITIGATION: {
        url += WorkbenchRESTEndpoint.MITIGATION;
        break;
      }
      case StixIdentityPrefix.MATRIX: {
        url += WorkbenchRESTEndpoint.MATRIX;
        break;
      }
      case StixIdentityPrefix.IDENTITY: {
        url += WorkbenchRESTEndpoint.IDENTITY;
        break;
      }
      case StixIdentityPrefix.MARKING_DEF: {
        url += WorkbenchRESTEndpoint.MARKING_DEF;
        break;
      }
      case StixIdentityPrefix.RELATIONSHIP: {
        url += WorkbenchRESTEndpoint.RELATIONSHIP;
        break;
      }
      case StixIdentityPrefix.NOTE: {
        url += WorkbenchRESTEndpoint.NOTE;
        break;
      }
      default: {
        return;
      }
    }
    url += stixId;
    if (versions == true) {
      url += "?versions=all";
    }
    const object: WorkbenchStixObjectDto[] = await this.fetchHttp(url);
    if (object) {
      // Don't return the object if it does not belong to the specified collection
      if (object[0].workspace.collections[0].collection_ref == collectionId) {
        return object; // <-- remember this is an array containing one element
      }
    }
  }
}
