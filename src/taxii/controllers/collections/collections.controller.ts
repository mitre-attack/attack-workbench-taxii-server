import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseFilters,
  UseInterceptors,
} from "@nestjs/common";

import {
  ApiHeader,
  ApiNotImplementedResponse,
  ApiOkResponse,
  ApiServiceUnavailableResponse,
} from "@nestjs/swagger";

// ** logger ** //
import { TaxiiLoggerService as Logger } from "src/common/logger/taxii-logger.service";

// ** providers ** //
import {
  CollectionService,
  EnvelopeService,
  ManifestService,
  VersionService,
} from "src/taxii/providers";

// ** dtos ** //
import {
  TaxiiCollectionDto,
  TaxiiCollectionsDto,
} from "src/taxii/providers/collection/dto";
import { EnvelopeDto } from "src/taxii/providers/envelope/dto";
import { ManifestDto } from "src/taxii/providers/manifest/dto";
import { MatchDto } from "src/common/models/match/match.dto";
import { VersionDto } from "src/taxii/providers/version/dto/version.dto";

// ** middleware ** //
import { MatchQuery } from "src/common/decorators/match.query.decorator";
import { TaxiiExceptionFilter } from "src/common/exceptions/taxii-exception.filter";
import { TimestampQuery } from "src/common/decorators/timestamp.query.decorator";
import { NumberQuery } from "src/common/decorators/number.query.decorator";
import { TaxiiServiceUnavailableException } from "src/common/exceptions";
import {
  SetTaxiiDateHeadersInterceptor,
  TaxiiDateFrom,
} from "src/common/interceptors/set-taxii-date-headers.interceptor";

// ** transformation pipes ** //
import { ParseTimestampPipe } from "src/common/pipes/parse-timestamp.pipe";
import { ParseMatchQueryParamPipe } from "src/common/pipes/parse-match-query-param.pipe";

// ** open-api ** //
import { SwaggerDocumentation as SWAGGER } from "./collections.controller.swagger.json";
import { VersionsResource } from "../../providers/version/dto/versions-resource";
import { EnvelopeResource } from "src/taxii/providers/envelope/dto/envelope-resource";
import { TaxiiCollectionsResource } from "../../providers/collection/dto/taxii-collections-dto/taxii-collections-resource";
import { TaxiiCollectionResource } from "../../providers/collection/dto/taxii-collection-dto/taxii-collection-resource";
import { ManifestResource } from "../../providers/manifest/dto";

@ApiHeader({
  name: SWAGGER.AcceptHeader.Name,
  description: SWAGGER.AcceptHeader.Description,
})
@Controller("/collections")
@UseFilters(new TaxiiExceptionFilter())
export class CollectionsController {
  constructor(
    private readonly logger: Logger,
    private readonly collectionService: CollectionService,
    private readonly envelopeService: EnvelopeService,
    private readonly manifestService: ManifestService,
    private readonly versionsService: VersionService
  ) {
    logger.setContext(CollectionsController.name);
  }

  @ApiOkResponse({
    description: SWAGGER.GetCollections.Description,
    type: TaxiiCollectionsResource,
  })
  @Get("/")
  async getCollections(): Promise<TaxiiCollectionsDto> {
    this.logger.debug(
      `Received request for all collections`,
      this.constructor.name
    );
    return await this.collectionService.findAll();
  }

  @ApiOkResponse({
    description: SWAGGER.GetACollection.Description,
    type: TaxiiCollectionResource,
  })
  @Get("/:collectionId/")
  async getACollection(
    @Param("collectionId") collectionId: string
  ): Promise<TaxiiCollectionDto> {
    this.logger.debug(
      `Received request for a single collection with options { collectionId: ${collectionId} }`,
      this.constructor.name
    );
    return await this.collectionService.findOne(collectionId);
  }

  @ApiOkResponse({
    description: SWAGGER.GetObjectManifests.Description,
    type: ManifestResource,
  })
  @Get("/:collectionId/manifest/")
  @UseInterceptors(
    new SetTaxiiDateHeadersInterceptor({ useType: TaxiiDateFrom.MANIFEST })
  )
  async getObjectManifests(
    @Param("collectionId") collectionId: string,
    @TimestampQuery("added_after") addedAfter?: string,
    @NumberQuery("limit") limit?: number,
    @NumberQuery("next") next?: number,
    @MatchQuery("match") match?: MatchDto
  ): Promise<ManifestDto> {
    this.logger.debug(
      `Received request for object manifests with options { collectionId: ${collectionId}, addedAfter: ${addedAfter}, limit: ${limit}, next: ${next}, match: ${JSON.stringify(
        match
      )} }`,
      this.constructor.name
    );
    return await this.manifestService.getManifestsByCollection(
      collectionId,
      addedAfter,
      limit,
      next,
      match
    );
  }

  @ApiOkResponse({
    description: SWAGGER.GetObjects.Description,
    type: EnvelopeResource,
  })
  @Get("/:collectionId/objects/")
  @UseInterceptors(
    new SetTaxiiDateHeadersInterceptor({ useType: TaxiiDateFrom.ENVELOPE })
  )
  async getObjects(
    @Param("collectionId") collectionId: string,
    @Query("added_after", ParseTimestampPipe) addedAfter?: string,
    @NumberQuery("limit") limit?: number,
    @NumberQuery("next") next?: number,
    @Query("match", ParseMatchQueryParamPipe) match?: MatchDto
  ): Promise<EnvelopeDto> {
    this.logger.debug(
      `Received request for objects with options { collectionId: ${collectionId}, addedAfter: ${addedAfter}, limit: ${limit}, next: ${next}, match: ${match} }`,
      this.constructor.name
    );
    return await this.envelopeService.findByCollectionId(
      collectionId,
      addedAfter,
      limit,
      next,
      match
    );
  }

  @ApiOkResponse({
    description: SWAGGER.GetAnObject.Description,
    type: EnvelopeResource,
  })
  @Get("/:collectionId/objects/:objectId")
  @UseInterceptors(
    new SetTaxiiDateHeadersInterceptor({ useType: TaxiiDateFrom.ENVELOPE })
  )
  async getAnObject(
    @Param("collectionId") collectionId: string,
    @Param("objectId") objectId: string,
    @NumberQuery("limit") limit?: number,
    @NumberQuery("next") next?: number,
    @Query("added_after", ParseTimestampPipe) addedAfter?: string,
    @Query("match", ParseMatchQueryParamPipe) match?: MatchDto
  ): Promise<EnvelopeDto> {
    this.logger.debug(
      `Received request for an object with options { collectionId: ${collectionId}, objectId: ${objectId} }`,
      this.constructor.name
    );
    return await this.envelopeService.findByObjectId(
      collectionId,
      objectId,
      addedAfter,
      limit,
      next,
      match
    );
  }

  @ApiServiceUnavailableResponse({
    description: SWAGGER.AddObjects.Description,
  })
  @Post("/:collectionId/objects/")
  async addObjects(@Param("collectionId") collectionId: string): Promise<any> {
    this.logger.warn(
      `${this.addObjects.name} is not implemented`,
      this.constructor.name
    );
    throw new TaxiiServiceUnavailableException({
      title: "Not Implemented",
      description: SWAGGER.AddObjects.Description,
    });
  }

  @ApiNotImplementedResponse({
    description: SWAGGER.DeleteAnObject.Description,
  })
  @Delete("/:collectionId/objects/:objectId/")
  async deleteAnObject(
    @Param("collectionId") collectionId: string,
    @Param("objectId") objectId: string
  ): Promise<any> {
    this.logger.warn(
      `${this.deleteAnObject.name} is not implemented`,
      this.constructor.name
    );
    throw new TaxiiServiceUnavailableException({
      title: "Not Implemented",
      description: SWAGGER.DeleteAnObject.Description,
    });
  }

  @ApiOkResponse({
    description: SWAGGER.GetObjectVersions.Description,
    type: VersionsResource,
  })
  @Get("/:collectionId/objects/:objectId/versions/")
  @UseInterceptors(
    new SetTaxiiDateHeadersInterceptor({ useType: TaxiiDateFrom.VERSIONS })
  )
  async getObjectVersions(
    @Param("collectionId") collectionId: string,
    @Param("objectId") objectId: string,
    @Query("added_after", ParseTimestampPipe) addedAfter?: string,
    @NumberQuery("limit") limit?: number,
    @NumberQuery("next") next?: number,
    @Query("match", ParseMatchQueryParamPipe) match?: MatchDto
  ): Promise<VersionDto> {
    this.logger.debug(
      `Received request for object versions with options { collectionId: ${collectionId}, objectId: ${objectId}, addedAfter: ${addedAfter}, limit: ${limit}, next: ${next}, match: ${match} }`,
      this.constructor.name
    );
    return this.versionsService.findObjectVersions(
      collectionId,
      objectId,
      addedAfter,
      limit,
      next,
      match
    );
  }
}
