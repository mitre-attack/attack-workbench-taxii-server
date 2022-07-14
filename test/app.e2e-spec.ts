import * as request from "supertest";
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import {
  CollectionService,
  DiscoveryService,
  EnvelopeService,
  FilterService,
  ManifestService,
  ObjectService,
  PaginationService,
  VersionService,
} from "src/taxii/providers";
import { MockStixRepository } from "./mock-stix-repository";
import { CollectionsController } from "../src/taxii/controllers/collections/collections.controller";
import { HttpModule } from "@nestjs/axios";
import { STIX_REPO_TOKEN } from "../src/stix/constants";
import { TaxiiLoggerModule } from "../src/common/logger/taxii-logger.module";
import { TaxiiConfigModule, TaxiiConfigService } from "../src/config";
import { CollectionRepository } from "../src/taxii/providers/collection/collection.repository";
import { ObjectRepository } from "../src/taxii/providers/object/object.repository";
import { ManifestRecordService } from "../src/taxii/providers/manifest/manifest-record.service";
import { DEFAULT_WORKBENCH_AUTH_HEADER } from "../src/config/defaults";
import { RootController } from "../src/taxii/controllers/root/root.controller";
import {
  RequestContext,
  RequestContextModule,
} from "../src/common/middleware/request-context";
import { WorkbenchRepository } from "../src/stix/providers/workbench/workbench.repository";
import { TaxiiExceptionFilter } from "../src/common/exceptions/taxii-exception.filter";
import { AppModule } from "../src/app.module";

describe("CollectionsController", () => {
  let app: INestApplication;

  const stixRepo = new MockStixRepository();

  beforeAll(async () => {
    const tempConfigService = await Test.createTestingModule({
      imports: [TaxiiConfigModule],
    }).compile();

    const moduleRef = await Test.createTestingModule({
      imports: [
        AppModule.register({
          stixConnectOptions: tempConfigService
            .get(TaxiiConfigService)
            .createStixConnectOptions(),
          cacheConnectOptions: tempConfigService
            .get(TaxiiConfigService)
            .createCacheConnectOptions(),
        }),
      ],
      // imports: [
      //   RequestContextModule.forRoot({
      //     contextClass: RequestContext,
      //     isGlobal: true,
      //   }),
      //   TaxiiConfigModule,
      //   TaxiiLoggerModule,
      //   HttpModule.register({
      //     headers: { Authorization: `Basic ${DEFAULT_WORKBENCH_AUTH_HEADER}` },
      //   }),
      // ],
      // providers: [
      //   CollectionService,
      //   CollectionRepository,
      //   ObjectService,
      //   ObjectRepository,
      //   FilterService,
      //   PaginationService,
      //   EnvelopeService,
      //   ManifestService,
      //   ManifestRecordService,
      //   VersionService,
      //   DiscoveryService,
      //   {
      //     provide: STIX_REPO_TOKEN,
      //     useValue: WorkbenchRepository,
      //   },
      // ],
      // controllers: [CollectionsController, RootController],
    })
      .overrideProvider(STIX_REPO_TOKEN)
      .useValue(stixRepo)
      .overrideFilter(TaxiiExceptionFilter)
      .useValue(new TaxiiExceptionFilter())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it("GET /taxii2/", () => {
    return request(app.getHttpServer()).get("/taxii2/").expect(200);
  });

  it("GET /collections/", () => {
    return request(app.getHttpServer()).get("/collections/").expect(200);
  });

  it("GET /collections/{collection-id}/", () => {
    return request(app.getHttpServer())
      .get("/collections/mock-collection-id/")
      .expect(200);
  });

  it("GET /collections/{collection-id}/manifest/", () => {
    return request(app.getHttpServer())
      .get("/collections/mock-collection-id/manifest/")
      .expect(200);
  });

  it("GET /collections/{collection-id}/providers/", () => {
    return request(app.getHttpServer())
      .get("/collections/mock-collection-id/providers/")
      .expect(200);
  });

  it("GET /collections/{collection-id}/providers/{object-id}/", () => {
    return request(app.getHttpServer())
      .get("/collections/mock-collection-id/providers/mock-object-id/")
      .expect(200);
  });

  // it("POST /collections/{collection-id}/providers/", () => {
  //   return request(app.getHttpServer())
  //     .post("/collections/mock-collection-id/providers/")
  //     .expect(503);
  // });

  // it("DELETE /collections/{collection-id}/providers/{object-id}/", () => {
  //   return request(app.getHttpServer())
  //     .delete("/collections/mock-collection-id/providers/mock-object-id/")
  //     .expect(503);
  // });
  //
  // it("GET /collections/{collection-id}/providers/{object-id}/versions/", () => {
  //   return request(app.getHttpServer())
  //     .get("/collections/mock-collection-id/providers/mock-object-id/versions/")
  //     .expect(200);
  // });

  afterAll(async () => {
    await app.close();
  });
});
