import {
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseFilters,
  UseInterceptors,
} from "@nestjs/common";

import { ApiOkResponse } from "@nestjs/swagger";

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
import { ManifestRecordDto } from "src/taxii/providers/manifest/dto";
import { ManifestDto } from "src/taxii/providers/manifest/dto";
import { MatchDto } from "src/common/models/match/match.dto";
import { VersionDto } from "src/taxii/providers/version/dto/version.dto";

// ** middleware ** //
import { MatchQuery } from "src/common/decorators/match.query.decorator";
import { TaxiiExceptionFilter } from "src/common/exceptions/taxii-exception.filter";
import { SetMediaType } from "src/common/interceptors/set-media-type.interceptor";
import { TimestampQuery } from "src/common/decorators/timestamp.query.decorator";
import { NumberQuery } from "src/common/decorators/number.query.decorator";
import { TaxiiServiceUnavailableException } from "src/common/exceptions";
import {
  SetTaxiiDateHeadersInterceptor,
  TaxiiDateFrom,
} from "src/common/interceptors/set-taxii-date-headers.interceptor";

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
    description: "A list of STIX Collection objects",
    type: TaxiiCollectionsDto,
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
    description: "A single STIX Collection object",
    type: TaxiiCollectionDto,
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
    description:
      "Manifest information about the contents of a specific collection",
    type: ManifestRecordDto,
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
      `Received request for object manifests with options { collectionId: ${collectionId}, addedAfter: ${addedAfter}, limit: ${limit}, next: ${next}, match: ${match} }`,
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
    description: "A TAXII Envelope containing STIX objects",
    type: EnvelopeDto,
  })
  @Get("/:collectionId/objects/")
  @UseInterceptors(
    new SetTaxiiDateHeadersInterceptor({ useType: TaxiiDateFrom.ENVELOPE })
  )
  async getObjects(
    @Param("collectionId") collectionId: string,
    @TimestampQuery("added_after") addedAfter?: string,
    @NumberQuery("limit") limit?: number,
    @NumberQuery("next") next?: number,
    @MatchQuery("match") match?: MatchDto
  ): Promise<EnvelopeDto> {
    this.logger.debug(
      `Received request for objects with options { collectionId: ${collectionId}, addedAfter: ${addedAfter}, limit: ${limit}, next: ${next}, match: ${match} }`,
      this.constructor.name
    );
    return await this.envelopeService.findByCollection(
      collectionId,
      addedAfter,
      limit,
      next,
      match
    );
  }

  @ApiOkResponse({
    description: "A TAXII Envelope containing a specific STIX object",
    type: EnvelopeDto,
  })
  @Get("/:collectionId/objects/:objectId")
  @UseInterceptors(
    new SetTaxiiDateHeadersInterceptor({ useType: TaxiiDateFrom.ENVELOPE })
  )
  async getAnObject(
    @Param("collectionId") collectionId: string,
    @Param("objectId") objectId: string,
    @TimestampQuery("added_after") addedAfter?: string,
    @NumberQuery("limit") limit?: number,
    @MatchQuery("match") match?: MatchDto
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
      match
    );
  }

  // TODO implement in future release
  @ApiOkResponse({ description: "Add a new object to a specific collection" })
  @Post("/:collectionId/objects/")
  async addObjects(@Param("collectionId") collectionId: string): Promise<any> {
    this.logger.warn(
      `${this.addObjects.name} is not implemented`,
      this.constructor.name
    );
    throw new TaxiiServiceUnavailableException({
      title: "Not Implemented",
      description:
        "The 'Add Objects' endpoint is not implemented. STIX objects can be added via Workbench.",
    });
  }

  // TODO implement in future release
  @ApiOkResponse({ description: "Delete a specific object from a collection" })
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
      description: "The 'Delete An Object' endpoint is not implemented.",
    });
  }

  @ApiOkResponse({
    description: "Get a list of object version from a collection",
    type: VersionDto,
  })
  @Get("/:collectionId/objects/:objectId/versions/")
  @UseInterceptors(
    new SetTaxiiDateHeadersInterceptor({ useType: TaxiiDateFrom.VERSIONS })
  )
  async getObjectVersions(
    @Param("collectionId") collectionId: string,
    @Param("objectId") objectId: string,
    @TimestampQuery("added_after") addedAfter?: string,
    @NumberQuery("limit") limit?: number,
    @NumberQuery("next") next?: number,
    @MatchQuery("match") match?: MatchDto
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
