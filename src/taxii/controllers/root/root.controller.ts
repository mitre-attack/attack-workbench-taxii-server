import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { TaxiiNotFoundException, TaxiiServiceUnavailableException } from 'src/common/exceptions';
import { TaxiiLoggerService as Logger } from 'src/common/logger/taxii-logger.service';
import { DiscoveryService } from 'src/taxii/providers';
import { ApiRootDto, DiscoveryDto } from 'src/taxii/providers/discovery/dto';
import { releaseSegmentToVersion, ReleaseService } from 'src/taxii/providers/release';
import { ApiOkResponse } from '@nestjs/swagger';
import { DiscoveryResource } from '../../providers/discovery/dto';
import { SwaggerDocumentation as SWAGGER } from './root.controller.swagger.json';
import { ApiRootResource } from '../../providers/discovery/dto';

@Controller()
export class RootController {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly releaseService: ReleaseService,
    private readonly logger: Logger,
  ) {
    logger.setContext(RootController.name);
  }

  @Get('/health/ping')
  @HttpCode(HttpStatus.NO_CONTENT)
  healthPing(): void {
    this.logger.debug('Health ping.');
  }

  @ApiOkResponse({
    description: SWAGGER.ServerDiscovery.Description,
    type: DiscoveryResource,
  })
  @Get('/taxii2/')
  async serverDiscovery(): Promise<DiscoveryDto> {
    this.logger.debug(`Received a discovery request`, this.constructor.name);
    return await this.discoveryService.discover();
  }

  @ApiOkResponse({
    description: SWAGGER.GetApiRootInformation.Description,
    type: ApiRootResource,
  })
  @Get(`/`)
  getApiRootInformation(): ApiRootDto {
    this.logger.debug(`Received a request for API root information`, this.constructor.name);
    return this.discoveryService.findApiRootInformation();
  }

  /**
   * Disambiguates GET {api-root}/{segment}/:
   * - A segment shaped like a pinned API root (e.g. "attack-19.1") returns that root's API Root
   *   Information (404 if the release is not hydrated).
   * - Anything else is treated as a TAXII status ID; the 'Get Status' endpoint is not implemented.
   *
   * The two routes cannot be separated declaratively because Express 5 (path-to-regexp v8) does
   * not support inline parameter regexes.
   */
  @Get(`/:segment/`)
  async getReleaseApiRootInformationOrStatus(
    @Param('segment') segment: string,
  ): Promise<ApiRootDto> {
    const version = releaseSegmentToVersion(segment);

    if (version) {
      this.logger.debug(
        `Received a request for API root information for release ${version}`,
        this.constructor.name,
      );
      if (!(await this.releaseService.releaseExists(version))) {
        throw new TaxiiNotFoundException({
          title: 'API Root Not Found',
          description: `The API Root path segment '${segment}' does not correspond to an ATT&CK release available on this server. Request the discovery endpoint (GET /taxii2/) for the list of available API Roots.`,
        });
      }
      return this.discoveryService.findApiRootInformation(version);
    }

    this.logger.warn(`'Get Status' is not implemented`, this.constructor.name);
    throw new TaxiiServiceUnavailableException({
      title: 'Not Implemented',
      description: "The 'Get Status' endpoint is not implemented.",
    });
  }
}
