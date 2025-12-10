import { Controller, Delete, Get, Param, Post, Query, UseInterceptors } from '@nestjs/common';
// ** logger ** //
import { TaxiiLoggerService as Logger } from 'src/common/logger/taxii-logger.service';

// ** providers ** //
import {
  CollectionService,
  EnvelopeService,
  ManifestService,
  VersionService,
} from 'src/taxii/providers';

// ** dtos ** //
import { TaxiiCollectionDto, TaxiiCollectionsDto } from 'src/taxii/providers/collection/dto';
import { EnvelopeDto } from 'src/taxii/providers/envelope/dto';
import { ManifestDto } from 'src/taxii/providers/manifest/dto';
import { MatchDto } from 'src/common/models/match/match.dto';
import { VersionsDto } from 'src/taxii/providers/version/dto/versions.dto';

// ** middleware ** //
import { TimestampQuery } from 'src/common/decorators/timestamp.query.decorator';
import { NumberQuery } from 'src/common/decorators/number.query.decorator';
import { TaxiiServiceUnavailableException } from 'src/common/exceptions';
import {
  SetTaxiiDateHeadersInterceptor,
  TaxiiDateFrom,
} from 'src/common/interceptors/set-taxii-date-headers.interceptor';

// ** transformation pipes ** //
import { ParseTimestampPipe } from 'src/common/pipes/parse-timestamp.pipe';
import { ParseMatchQueryParamPipe } from 'src/common/pipes/parse-match-query-param.pipe';
import { instanceToPlain } from 'class-transformer';

// ** open-api ** //
import { ApiExcludeEndpoint, ApiHeader, ApiOkResponse } from '@nestjs/swagger';
import { SwaggerDocumentation as SWAGGER } from './collections.controller.swagger.json';
import { VersionsResource } from '../../providers/version/dto/versions-resource';
import { EnvelopeResource } from 'src/taxii/providers/envelope/dto/envelope-resource';
import { TaxiiCollectionsResource } from '../../providers/collection/dto/taxii-collections-dto/taxii-collections-resource';
import { TaxiiCollectionResource } from '../../providers/collection/dto/taxii-collection-dto/taxii-collection-resource';
import { ManifestResource } from '../../providers/manifest/dto';

@ApiHeader({
  name: SWAGGER.AcceptHeader.Name,
  description: SWAGGER.AcceptHeader.Description,
})
@Controller('/collections')
export class CollectionsController {
  constructor(
    private readonly logger: Logger,
    private readonly collectionService: CollectionService,
    private readonly envelopeService: EnvelopeService,
    private readonly manifestService: ManifestService,
    private readonly versionsService: VersionService,
  ) {
    logger.setContext(CollectionsController.name);
  }

  @ApiOkResponse({
    description: SWAGGER.GetCollections.Description,
    type: TaxiiCollectionsResource,
  })
  @Get('/')
  async getCollections(): Promise<TaxiiCollectionsDto> {
    this.logger.debug(`Received request for all collections`, this.constructor.name);
    return await this.collectionService.findAll();
  }

  @ApiOkResponse({
    description: SWAGGER.GetACollection.Description,
    type: TaxiiCollectionResource,
  })
  @Get('/:collectionId/')
  async getACollection(@Param('collectionId') collectionId: string): Promise<TaxiiCollectionDto> {
    this.logger.debug(
      `Received request for a single collection with options { collectionId: ${collectionId} }`,
      this.constructor.name,
    );
    const collection = await this.collectionService.findOne(collectionId);
    return instanceToPlain(collection, {
      excludeExtraneousValues: true,
    }) as TaxiiCollectionDto;
  }

  @ApiOkResponse({
    description: SWAGGER.GetObjectManifests.Description,
    type: ManifestResource,
  })
  @Get('/:collectionId/manifest/')
  @UseInterceptors(new SetTaxiiDateHeadersInterceptor({ useType: TaxiiDateFrom.MANIFEST }))
  async getObjectManifests(
    @Param('collectionId') collectionId: string,
    @TimestampQuery('added_after') addedAfter?: string,
    @NumberQuery('limit') limit?: number,
    @NumberQuery('next') next?: number,
    @Query('match', ParseMatchQueryParamPipe) matches?: MatchDto[],
  ): Promise<ManifestDto> {
    this.logger.debug(
      `Received request for object manifests with options { collectionId: ${collectionId}, addedAfter: ${addedAfter}, limit: ${limit}, next: ${next}, match: ${JSON.stringify(
        matches,
      )} }`,
      this.constructor.name,
    );
    return await this.manifestService.getManifestsByCollection(
      collectionId,
      addedAfter,
      limit,
      next,
      matches,
    );
  }

  @ApiOkResponse({
    description: SWAGGER.GetObjects.Description,
    type: EnvelopeResource,
  })
  @Get('/:collectionId/objects/')
  @UseInterceptors(new SetTaxiiDateHeadersInterceptor({ useType: TaxiiDateFrom.ENVELOPE }))
  async getObjects(
    @Param('collectionId') collectionId: string,
    @Query('added_after', ParseTimestampPipe) addedAfter?: string,
    @NumberQuery('limit') limit?: number,
    @NumberQuery('next') next?: number,
    @Query('match', ParseMatchQueryParamPipe) matches?: MatchDto[],
    /**
     * Quick note on the above multi-step pipeline that processes "matches":
     * The ParseArrayPipe is used to parse the match query parameter as an array.
     * It will automatically split the comma-separated values into an array.
     * The ParseMatchQueryParamPipe is then applied to each element of the parsed array to transform it into a MatchDto object.
     */
  ): Promise<EnvelopeDto> {
    this.logger.debug(
      `Received request for objects with options { collectionId: ${collectionId}, addedAfter: ${addedAfter}, limit: ${limit}, next: ${next}, matches: ${JSON.stringify(matches)} }`,
      this.constructor.name,
    );
    return await this.envelopeService.findByCollectionId(
      collectionId,
      addedAfter,
      limit,
      next,
      matches,
    );
  }

  @ApiOkResponse({
    description: SWAGGER.GetAnObject.Description,
    type: EnvelopeResource,
  })
  @Get('/:collectionId/objects/:objectId')
  @UseInterceptors(new SetTaxiiDateHeadersInterceptor({ useType: TaxiiDateFrom.ENVELOPE }))
  async getAnObject(
    @Param('collectionId') collectionId: string,
    @Param('objectId') objectId: string,
    @NumberQuery('limit') limit?: number,
    @NumberQuery('next') next?: number,
    @Query('added_after', ParseTimestampPipe) addedAfter?: string,
    @Query('match', ParseMatchQueryParamPipe) matches?: MatchDto[],
  ): Promise<EnvelopeDto> {
    this.logger.debug(
      `Received request for an object with options { collectionId: ${collectionId}, objectId: ${objectId} }`,
      this.constructor.name,
    );

    return await this.envelopeService.findByObjectId(
      collectionId,
      objectId,
      addedAfter,
      limit,
      next,
      matches,
    );
  }

  @ApiExcludeEndpoint()
  @Post('/:collectionId/objects/')
  async addObjects(@Param('collectionId') _collectionId: string): Promise<never> {
    this.logger.warn(`${this.addObjects.name} is not implemented`, this.constructor.name);
    throw new TaxiiServiceUnavailableException({
      title: 'Not Implemented',
      description: SWAGGER.AddObjects.Description,
    });
  }

  @ApiExcludeEndpoint()
  @Delete('/:collectionId/objects/:objectId/')
  async deleteAnObject(
    @Param('collectionId') _collectionId: string,

    @Param('objectId') _objectId: string,
  ): Promise<never> {
    this.logger.warn(`${this.deleteAnObject.name} is not implemented`, this.constructor.name);
    throw new TaxiiServiceUnavailableException({
      title: 'Not Implemented',
      description: SWAGGER.DeleteAnObject.Description,
    });
  }

  @ApiOkResponse({
    description: SWAGGER.GetObjectVersions.Description,
    type: VersionsResource,
  })
  @Get('/:collectionId/objects/:objectId/versions/')
  @UseInterceptors(new SetTaxiiDateHeadersInterceptor({ useType: TaxiiDateFrom.VERSIONS }))
  async getObjectVersions(
    @Param('collectionId') collectionId: string,
    @Param('objectId') objectId: string,
    @Query('added_after', ParseTimestampPipe) addedAfter?: string,
    @NumberQuery('limit') limit?: number,
    @NumberQuery('next') next?: number,
    @Query('match', ParseMatchQueryParamPipe) matches?: MatchDto[],
  ): Promise<VersionsDto> {
    this.logger.debug(
      `Received request for object versions with options { collectionId: ${collectionId}, objectId: ${objectId}, addedAfter: ${addedAfter}, limit: ${limit}, next: ${next}, match: ${JSON.stringify(matches)} }`,
      this.constructor.name,
    );
    return await this.versionsService.findObjectVersions(
      collectionId,
      objectId,
      addedAfter,
      limit,
      next,
      matches,
    );
  }
}
