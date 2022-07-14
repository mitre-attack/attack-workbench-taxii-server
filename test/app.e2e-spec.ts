import * as request from "supertest";
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { MockStixRepository } from "./mock-stix.repository";
import { STIX_REPO_TOKEN } from "../src/stix/constants";
import { TaxiiConfigModule, TaxiiConfigService } from "../src/config";
import { AppModule } from "../src/app.module";
import { DiscoveryService } from "src/taxii/providers/discovery/discovery.service";
import { Response } from "supertest";

/**
 * `expect` works by throwing an `Error` when an expectation fails. The `message` property of the `Error` is what gets
 * printed in the test report. This function slightly modifies the `message` property by appending a pretty-printed
 * copy of the `Response` body and headers.
 * @param err This is what gets thrown by `expect` when an expectation fails
 * @param res This is the `Response` object that was mocked during the failed test.
 */
function formatError(err: Error, res: Response) {
  return `${err.message}\n\nResponse Headers: ${JSON.stringify(
    res.headers,
    null,
    2
  )}\n\nResponse Body: ${JSON.stringify(res.body, null, 2)}`;
}

describe("CollectionsController", () => {
  let app: INestApplication;

  // The provider in the STIX module (usually WorkbenchRepository) will be overridden with a mock provider that serves
  // fake STIX data
  const stixRepo = new MockStixRepository();

  // All mock HTTP requests must have a TAXII-compliant Accept header included
  const commonHeaders = {
    Accept: "application/taxii+json;version=2.1",
  };

  // Initialize the application
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
    })
      .overrideProvider(STIX_REPO_TOKEN)
      .useValue(stixRepo)
      .compile();

    await tempConfigService.close();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  /**
   * 1.6.8 Content Negotiation
   * TAXII Clients and Servers must use correct Accept and Content-Type headers to negotiate TAXII versions
   * Sends a request with a bad Accept header -> expect 406 response
   */
  it("Content Negotiation - Bad Accept Header", (done) => {
    request(app.getHttpServer())
      .get("/taxii2/")
      .set({ Accept: "not-a-real-media-type" })
      .end((err, res) => {
        try {
          expect(res.statusCode).toEqual(406);
        } catch (err) {
          err.message = formatError(err, res);
          throw err;
        }
        done();
      });
  });

  /**
   * 4.1 Server Discovery
   */
  it("Server Discovery :: GET /taxii2/", (done) => {
    request(app.getHttpServer())
      .get("/taxii2/")
      .set(commonHeaders)
      .end((err, res) => {
        try {
          expect(res.statusCode).toEqual(200);
          expect(res.body).toEqual({ ...app.get(DiscoveryService).discover() });
        } catch (err) {
          err.message = formatError(err, res);
          throw err;
        }
        done();
      });
  });

  /**
   * 4.2 Get API Root Information
   */
  it("Get API Root Information :: GET {api-root}", (done) => {
    request(app.getHttpServer())
      .get("/")
      .set(commonHeaders)
      .end((err, res) => {
        try {
          expect(res.statusCode).toEqual(200);
          expect(res.body).toEqual(
            app.get(DiscoveryService).findApiRootInformation()
          );
        } catch (err) {
          err.message = formatError(err, res);
          throw err;
        }
        done();
      });
  });

  /**
   * 5.1 Get Collections
   */
  it("Get Collections :: GET {api-root}/collections/", (done) => {
    request(app.getHttpServer())
      .get("/collections/")
      .set(commonHeaders)
      .end((err, res) => {
        try {
          expect(res.statusCode).toEqual(200);
          expect(res.headers["content-type"]).toBeDefined();
          expect(res.headers["content-type"]).toEqual(
            "application/taxii+json; charset=utf-8; version=2.1"
          );
        } catch (err) {
          err.message = formatError(err, res);
          throw err;
        }
        done();
      });
  });

  /**
   * 5.2 Get a Collection
   */
  it("Get a Collection :: GET {api-root}/collections/{collection-id}/", (done) => {
    request(app.getHttpServer())
      .get("/collections/mock-collection-id/")
      .set(commonHeaders)
      .end((err, res) => {
        try {
          expect(res.statusCode).toEqual(200);
          expect(res.headers["content-type"]).toBeDefined();
          expect(res.headers["content-type"]).toEqual(
            "application/taxii+json; charset=utf-8; version=2.1"
          );
        } catch (err) {
          err.message = formatError(err, res);
          throw err;
        }
        done();
      });
  });

  /**
   * 5.3 Get Object Manifests
   */
  it("Get Object Manifests :: GET {api-root}/collections/{collection-id}/manifest/", (done) => {
    request(app.getHttpServer())
      .get("/collections/mock-collection-id/manifest/")
      .set(commonHeaders)
      .end((err, res) => {
        try {
          expect(res.statusCode).toEqual(200);
          expect(res.headers["content-type"]).toBeDefined();
          expect(res.headers["content-type"]).toEqual(
            "application/taxii+json; charset=utf-8; version=2.1"
          );
          expect(res.headers["x-taxii-date-added-first"]).toBeDefined();
          expect(res.headers["x-taxii-date-added-last"]).toBeDefined();
        } catch (err) {
          err.message = formatError(err, res);
          throw err;
        }
        done();
      });
  });

  /**
   * 5.4 Get Objects
   */
  it("Get Objects :: GET {api-root}/collections/{collection-id}/objects/", (done) => {
    request(app.getHttpServer())
      .get("/collections/mock-collection-id/objects/")
      .set(commonHeaders)
      .end((err, res) => {
        try {
          expect(res.statusCode).toEqual(200);
          expect(res.headers["content-type"]).toBeDefined();
          expect(res.headers["content-type"]).toEqual(
            "application/taxii+json; charset=utf-8; version=2.1"
          );
          expect(res.headers["x-taxii-date-added-first"]).toBeDefined();
          expect(res.headers["x-taxii-date-added-last"]).toBeDefined();
        } catch (err) {
          err.message = formatError(err, res);
          throw err;
        }
        done();
      });
  });

  /**
   * 5.6 Get an Object
   */
  it("Get an Object :: GET {api-root}/collections/{collection-id}/objects/{object-id}/", (done) => {
    request(app.getHttpServer())
      .get("/collections/mock-collection-id/objects/mock-object-id/")
      .set(commonHeaders)
      .end((err, res) => {
        try {
          expect(res.statusCode).toEqual(200);
          expect(res.headers["content-type"]).toBeDefined();
          expect(res.headers["content-type"]).toEqual(
            "application/taxii+json; charset=utf-8; version=2.1"
          );
          expect(res.headers["x-taxii-date-added-first"]).toBeDefined();
          expect(res.headers["x-taxii-date-added-last"]).toBeDefined();
        } catch (err) {
          err.message = formatError(err, res);
          throw err;
        }
        done();
      });
  });

  /**
   * 5.5 Add Objects
   */
  it("Add Objects :: POST {api-root}/collections/{collection-id}/objects/", (done) => {
    request(app.getHttpServer())
      .post("/collections/mock-collection-id/objects/")
      .set(commonHeaders)
      .end((err, res) => {
        try {
          expect(res.statusCode).toEqual(503);
        } catch (err) {
          err.message = formatError(err, res);
          throw err;
        }
        done();
      });
  });

  /**
   * 5.7 Delete an Object
   */
  it("Delete an Object :: DELETE {api-root}/collections/{collection-id}/objects/{object-id}/", (done) => {
    request(app.getHttpServer())
      .delete("/collections/mock-collection-id/objects/mock-object-id/")
      .set(commonHeaders)
      .end((err, res) => {
        try {
          expect(res.statusCode).toEqual(503);
        } catch (err) {
          err.message = formatError(err, res);
          throw err;
        }
        done();
      });
  });

  /**
   * 5.8 Get Object Versions
   */
  it("Get Object Versions :: GET {api-root}/collections/{collection-id}/objects/{object-id}/versions/", (done) => {
    request(app.getHttpServer())
      .get("/collections/mock-collection-id/objects/mock-object-id/versions/")
      .set(commonHeaders)
      .end((err, res) => {
        try {
          expect(res.statusCode).toEqual(200);
          expect(res.headers["content-type"]).toBeDefined();
          expect(res.headers["content-type"]).toEqual(
            "application/taxii+json; charset=utf-8; version=2.1"
          );
          expect(res.headers["x-taxii-date-added-first"]).toBeDefined();
          expect(res.headers["x-taxii-date-added-last"]).toBeDefined();
        } catch (err) {
          err.message = formatError(err, res);
          throw err;
        }
        done();
      });
  });

  /**
   * A simple test that validates that basic pagination is working.
   * A request is sent with URL query parameter `limit=5`. The expected response will include exactly 5 objects.
   */
  it("Pagination is working", (done) => {
    request(app.getHttpServer())
      .get("/collections/mock-collection-id/objects/?limit=5")
      .set(commonHeaders)
      .end((err, res) => {
        try {
          expect(res.statusCode).toEqual(200);
          expect(res.headers["content-type"]).toBeDefined();
          expect(res.headers["content-type"]).toEqual(
            "application/taxii+json; charset=utf-8; version=2.1"
          );
          expect(res.headers["x-taxii-date-added-first"]).toBeDefined();
          expect(res.headers["x-taxii-date-added-last"]).toBeDefined();
          expect(res.body.objects).toBeDefined(); // <-- res.body is an instance of EnvelopeDto
          expect(res.body.objects).toHaveLength(5);
        } catch (err) {
          err.message = formatError(err, res);
          throw err;
        }
        done();
      });
  });

  /**
   * Close the application after all tests are done
   */
  afterAll(async () => {
    await app.close();
  });
});
