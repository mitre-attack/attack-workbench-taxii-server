import { Injectable, LogLevel } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
// import {LOG_LEVELS} from "../constants";
import { CACHE_OPTIONS } from "../cache/constants";
import { TaxiiConfigServiceInterface } from "./interfaces/taxii-config.service.interface";
import { CacheConnectOptions } from "../cache/interfaces/cache-module-options.interface";
import { StixConnectOptions } from "../stix/interfaces";
import { isDefined } from "class-validator";

/**
 * This provider is responsible for loading all user-definable configuration parameters (imported from
 * environment variables) and making them available to all necessary app services
 */
@Injectable()
export class TaxiiConfigService implements TaxiiConfigServiceInterface {
  constructor(private configService: ConfigService) {}

  createCacheConnectOptions(): CacheConnectOptions {
    const cacheType = this.configService.get<string>("app.cacheType");
    switch (cacheType) {
      // ** MEMCACHED OPTIONS ** //
      case CACHE_OPTIONS.MEMCACHED: {
        const cacheHost = this.configService.get<string>("app.cacheHost");
        const maxValueSize: number = this.configService.get<number>(
          "app.cacheMaxValueSize"
        );
        const ttl: number = this.configService.get<number>("app.cacheTtl");
        const reconnect: boolean =
          this.configService.get<boolean>("app.cacheReconnect");

        return {
          type: cacheType,
          host: cacheHost,
          ttl: ttl,
          maxValueSize: maxValueSize,
          reconnect: reconnect,
        };
      }
      // ** DEFAULT CACHE OPTIONS ** //
      case CACHE_OPTIONS.DEFAULT: {
        const ttl: number = this.configService.get<number>("app.cacheTtl");
        return {
          type: cacheType,
          ttl: ttl,
        };
      }
      // ** DEFAULT CACHE OPTIONS ** //
      default: {
        const ttl: number = this.configService.get<number>("app.cacheTtl");
        return {
          ttl: ttl,
        };
      }
    }
  }

  createStixConnectOptions(): StixConnectOptions {
    return {
      useType: this.STIX_DATA_SRC,
      workbench: {
        baseUrl: this.WORKBENCH_REST_API_URL,
        authorization: this.WORKBENCH_AUTH_HEADER,
      },
    };
  }

  get APP_ADDRESS(): string {
    return this.configService.get<string>("app.address");
  }

  get APP_PORT(): number {
    return this.configService.get<number>("app.port");
  }

  get MAX_CONTENT_LENGTH(): number {
    return this.configService.get<number>("app.maxContentLength");
  }

  get API_ROOT_PATH(): string {
    return this.configService.get<string>("app.apiRootPath");
  }

  get API_ROOT_TITLE(): string {
    return this.configService.get<string>("app.apiRootTitle");
  }

  get API_ROOT_DESCRIPTION(): string {
    return this.configService.get<string>("app.apiRootDescription");
  }

  get CONTACT(): string {
    return this.configService.get<string>("app.contact");
  }

  get CACHE_TYPE(): string {
    return this.configService.get<string>("app.cacheType");
  }

  get CACHE_HOST(): string {
    return this.configService.get<string>("app.cacheHost");
  }

  get CACHE_PORT(): number {
    return this.configService.get<number>("app.cachePort");
  }

  get CACHE_TTL(): number {
    return this.configService.get<number>("app.cacheTimeToLive");
  }

  get CACHE_MAX_SIZE(): number {
    return this.configService.get<number>("app.cacheMaxValueSize");
  }

  get CACHE_RECONNECT(): boolean {
    return this.configService.get<boolean>("app.cacheReconnect");
  }

  get CORS_ENABLED(): boolean {
    return this.configService.get<boolean>("app.corsEnabled");
  }

  get WORKBENCH_REST_API_URL(): string {
    return this.configService.get<string>("app.workbenchRestApiUrl");
  }

  get WORKBENCH_AUTH_HEADER(): string {
    return this.configService.get<string>("app.workbenchAuthHeader");
  }

  get STIX_DATA_SRC(): string {
    return this.configService.get<string>("app.stixDataSrc");
  }

  get HTTPS_ENABLED(): boolean {
    return this.configService.get<string>("app.httpsEnabled") === "true";
  }

  get SSL_PRIVATE_KEY(): Buffer {
    const encodedKey = this.configService.get("app.sslPrivateKeyBase64Encoded");
    if (isDefined(encodedKey)) {
      const buffer = Buffer.from(encodedKey, "base64");
      if (buffer.toString("ascii")) {
        return buffer;
      }
    }
    return fs.readFileSync("config/private-key.pem");
  }

  get SSL_PUBLIC_KEY(): Buffer {
    const encodedKey = this.configService.get("app.sslPublicKeyBase64Encoded");

    if (isDefined(encodedKey)) {
      const buffer = Buffer.from(encodedKey, "base64");
      if (buffer.toString("ascii")) {
        return buffer;
      }
    }
    return fs.readFileSync("config/public-certificate.pem");
  }

  get LOG_LEVEL(): LogLevel {
    return this.configService.get<LogLevel>("app.logLevel");
  }

  get LOG_TO_FILE(): boolean {
    return this.configService.get<boolean>("app.logToFile");
  }

  get LOG_TO_HTTP_HOST(): string {
    return this.configService.get<string>("app.logToHttpHost");
  }

  get LOG_TO_HTTP_PORT(): number {
    return this.configService.get<number>("app.logToHttpPort");
  }

  get LOG_TO_HTTP_PATH(): string {
    return this.configService.get<string>("app.logToHttpPath");
  }

  get LOG_TO_SLACK_URL(): string {
    return this.configService.get<string>("app.logToSlackUrl");
  }

  get LOG_TO_SENTRY_DSN(): string {
    return this.configService.get<string>("app.logToSentryDsn");
  }
}
