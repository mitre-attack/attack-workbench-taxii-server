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
import { WorkbenchCollectionDto } from "../../dto/workbench-collection.dto";
import { plainToClass, plainToInstance } from "class-transformer";
import { WorkbenchCollectionBundleDto } from "../../dto/workbench-collection-bundle.dto";
import { WorkbenchStixObjectDto } from "../../dto/workbench-stix-object.dto";
import { StixIdentityPrefix, WorkbenchRESTEndpoint } from "../../constants";
import { WorkbenchConnectOptionsInterface } from "../../interfaces/workbench-connect-options.interface";
import { WORKBENCH_OPTIONS } from "../../constants";

@Injectable()
export class WorkbenchRepository {
  private readonly baseUrl: string;
  private readonly cacheTtl: number;

  constructor(
    private readonly logger: Logger,
    private readonly httpService: HttpService,
    @Inject(WORKBENCH_OPTIONS)
    private readonly options: WorkbenchConnectOptionsInterface,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {
    this.baseUrl = options.baseUrl;
    this.cacheTtl = options.cacheTtl;
    logger.setContext(WorkbenchRepository.name);
  }

  /**
   * Utility function to cache Workbench responses
   * @param url Keys will always be the full Workbench REST API endpoint (URL) that generated the response
   * @param item The entire HTTP response retrieved from the connected Workbench REST API
   * @private
   */
  private async addToCache(url: string, item: any): Promise<any> {
    const cacheKey = this.generateKeyFromUrl(url);
    this.logger.debug(`Writing STIX data at cache index: '${cacheKey}'.`);

    try {
      return await this.cacheManager.set(cacheKey, item, {
        ttl: this.cacheTtl,
      });
    } catch (e) {
      this.logger.error(
        `An error occurred while writing STIX data to cache index '${cacheKey}'.`
      );
      this.logger.error(e.message);
      this.logger.error(e.stack);
      throw e;
    }
  }

  private generateKeyFromUrl(url: string): string {
    return url.slice(this.baseUrl.length);
  }

  /**
   * Utility function to retrieve cached responses from the cache
   * @param url Index by which cached responses are retrieved. Keys will always be the full Workbench REST API
   *            endpoint (URL) that generated the response
   * @private
   */
  private async getFromCache(url: string): Promise<any> {
    const cacheKey = this.generateKeyFromUrl(url);

    this.logger.debug(`Requesting STIX data from cache index '${cacheKey}'.`);
    let cacheResponse;
    try {
      // get the STIX data from the cache
      cacheResponse = await this.cacheManager.get(cacheKey);
    } catch (e) {
      // an error occurred while attempting to read from the cache
      this.logger.debug(
        `An error occurred while retrieving data from cache at index '${cacheKey}'.`
      );
      this.logger.error(e.message);
      this.logger.error(e.stack);
      throw e;
    }
    // cache read operation succeeded!
    if (cacheResponse) {
      this.logger.debug(
        `Cache hit at index '${cacheKey}'. Returning cached STIX data.`
      );
      return cacheResponse;
    }
    this.logger.debug(
      `Cache miss at index '${cacheKey}'. Returning cached STIX data.`
    );
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
  async getAllStixObjects(
    excludeExtraneousValues = true
  ): Promise<WorkbenchStixObjectDto[]> {
    const url = `${this.baseUrl}/api/attack-objects`;
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
          excludeExtraneousValues: excludeExtraneousValues,
        })
      );
    });
    // Cache the response by URL then return
    try {
      await this.addToCache(url, allStixObjects);
    } catch (e) {
      this.logger.error("Failed to cache ATT&CK objects");
      this.logger.error(e.message);
    }
    return allStixObjects;
  }

  /**
   * Retrieves a list of all available x-mitre-collection objects
   * @param collectionId Only return the target collection if specified
   */
  async getCollections(
    collectionId?: string
  ): Promise<WorkbenchCollectionDto[]> {
    let url = `${this.baseUrl}/api/collections/`;
    if (collectionId) {
      url += collectionId;
    }

    // Fetch the data from either the cache (in the case of a cache hit) or Workbench (cache miss)
    let response: WorkbenchStixObjectDto[];
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
    const url = `${this.baseUrl}/api/collection-bundles?collectionId=${collectionId}`;

    // Fetch the data from either the cache (in the case of a cache hit) or Workbench (cache miss)
    let response: WorkbenchCollectionBundleDto;

    try {
      response = await this.getFromCache(url);

      if (response) {
        // cache hit - return the cached data
        return response;
      } else {
        // cache miss - get the data from workbench
        response = await this.fetchHttp(url);
      }
    } catch (e) {
      // cache malfunction - fallback to getting the data from workbench
      response = await this.fetchHttp(url);
    }

    // return this.getFromCache(url)
    //   .then(async (response) => {
    //     if (response) {
    //       return this.doTheRest(response, url);
    //     } else {
    //       response = await this.fetchHttp(url);
    //       return this.doTheRest(response, url);
    //     }
    //   })
    //   .catch((err) => {
    //     throw err;
    //   });

    this.logger.debug(`Retrieved STIX data! Data will be deserialized.`);

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

  // async doTheRest(response, url): Promise<WorkbenchCollectionBundleDto> {
  //   this.logger.debug(`Retrieved STIX data! Data will be deserialized.`);
  //
  //   // Deserialize the response body
  //   const collectionBundle: WorkbenchCollectionBundleDto = plainToInstance(
  //     WorkbenchCollectionBundleDto,
  //     response,
  //     { excludeExtraneousValues: true }
  //   );
  //
  //   // Cache the response by URL then return
  //   await this.addToCache(url, collectionBundle);
  //   return collectionBundle;
  // }

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
    let url = `${this.baseUrl}`;
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
