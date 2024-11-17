import {
  ConsoleLogger,
  Inject,
  Injectable,
} from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom, map } from "rxjs";
import {
  TaxiiBadRequestException,
  TaxiiNotFoundException,
  TaxiiServiceUnavailableException,
} from "src/common/exceptions";
import { WorkbenchCollectionDto, WorkbenchCollectionStixProperties } from "src/stix/dto/workbench-collection.dto";
import { plainToInstance } from "class-transformer";
import { WorkbenchCollectionBundleDto } from "src/stix/dto/workbench-collection-bundle.dto";
import { AttackObjectDto } from "src/stix/dto/attack-object.dto";
import { StixIdentityPrefix, WorkbenchRESTEndpoint } from "src/stix/constants";
import { WorkbenchConnectOptionsInterface } from "src/stix/interfaces/workbench-connect-options.interface";
import { WORKBENCH_OPTIONS } from "src/stix/constants";
import { StixBundleDto } from "src/stix/dto/stix-bundle.dto";

interface WorkbenchCollectionResponseDto {
  _id: string;
  workspace: any;
  stix: WorkbenchCollectionStixProperties;
  __t: string;
  __v: number;
  created_by_identity: any;
}

@Injectable()
export class WorkbenchRepository {
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly logger: ConsoleLogger,
    @Inject(WORKBENCH_OPTIONS) private readonly options: WorkbenchConnectOptionsInterface,
  ) {
    this.baseUrl = options.baseUrl;
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
   * Retrieves a STIX bundle containing all STIX objects for a specified ATT&CK domain.
   * 
   * @param domain The ATT&CK domain to retrieve ("enterprise-attack", "mobile-attack", or "ics-attack").
   * @returns The STIX bundle for the specified domain.
   */
  async getStixBundle(domain: string, version: '2.0' | '2.1'): Promise<StixBundleDto> {

    // Validate the domain parameter to ensure it matches one of the supported domains
    const supportedDomains = ["enterprise-attack", "mobile-attack", "ics-attack"];
    if (!supportedDomains.includes(domain)) {
      throw new Error(
        `Invalid domain specified: ${domain}. Supported domains are: ${supportedDomains.join(", ")}`
      );
    }

    // Construct the URL for fetching the STIX bundle
    const url = `${this.baseUrl}/api/stix-bundles?domain=${domain}&includeRevoked=true&includeDeprecated=true&stixVersion=${version}`;

    // Fetch the bundle data from the Workbench REST API
    const response: StixBundleDto = await this.fetchHttp(url);

    return response;

    // TODO migrate to the following code once the @mitre-attack/attack-data-model is integrated
    // Validate the response structure to ensure it's a valid STIX bundle
    // try {
    //   const [stixBundle] = response; // The response is an array with a single STIX bundle object
    //   return stixBundleSchema.parse(stixBundle); // Use ADM's `stixBundleSchema` for validation
    // } catch (error) {
    //   if (error instanceof z.ZodError) {
    //     // Log details about the validation errors encountered
    //     const errorMessages = error.errors.map(
    //       (issue) => `Path: ${issue.path.join(".")}, Error: ${issue.message}`
    //     );
    //     this.logger.error(
    //       `STIX bundle validation failed for domain "${domain}":\n${errorMessages.join("\n")}`
    //     );
    //   }
    //   throw new Error(`Failed to retrieve or validate STIX bundle for domain "${domain}".`);
    // }
  }

  /**
   * Retrieves a list of all available STIX objects
   */
  async getAllStixObjects(
    excludeExtraneousValues = true
  ): Promise<AttackObjectDto[]> {
    const url = `${this.baseUrl}/api/attack-objects?versions=all`;
    // Get all STIX objects from Workbench. The expected response body contains an array of STIX objects.
    const response: Array<AttackObjectDto> = await this.fetchHttp(url);
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
        plainToInstance(AttackObjectDto, elem, {
          excludeExtraneousValues: excludeExtraneousValues,
        })
      );
    });
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

    // Fetch the data from Workbench
    const response: WorkbenchCollectionResponseDto[] = await this.fetchHttp(url);

    // Extract only the STIX data we need
    return response.map(({ stix }) => new WorkbenchCollectionDto(stix));
  }

  /**
   * Retrieves a STIX bundle containing all STIX object in the specified collection
   * @param collectionId Identifier of the target collection
   */
  async getCollectionBundle(
    collectionId: string
  ): Promise<WorkbenchCollectionBundleDto> {
    const url = `${this.baseUrl}/api/collection-bundles?collectionId=${collectionId}`;

    // Fetch the data from Workbench
    return await this.fetchHttp(url);
    
    // TODO the serialization code is not working. it strips all the STIX properties and leaves an empty object. Let's revisit this after the ADM is integrated.
    // this.logger.debug(`Retrieved STIX data! Data will be deserialized.`);
    // Deserialize the response body
    // const collectionBundle: WorkbenchCollectionBundleDto = plainToInstance(
      //   WorkbenchCollectionBundleDto,
    //   response,
    //   { excludeExtraneousValues: true }
    // );
    // return collectionBundle;
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
  ): Promise<AttackObjectDto[]> {
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
    const object: AttackObjectDto[] = await this.fetchHttp(url);
    if (object) {
      // Don't return the object if it does not belong to the specified collection
      if (object[0].workspace.collections[0].collection_ref == collectionId) {
        return object; // <-- remember this is an array containing one element
      }
    }
  }
}
