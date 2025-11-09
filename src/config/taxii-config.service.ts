import { Injectable, LogLevel } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import { TaxiiConfigServiceInterface } from "./interfaces/taxii-config.service.interface";
import { StixConnectOptions } from "../stix/interfaces";
import { isDefined } from "class-validator";
import { AppConnectOptions } from "../interfaces";
import { DatabaseConnectOptions } from "../interfaces/database-connect-options.interface";
import { HydrateConnectOptions } from "src/hydrate/interfaces/hydrate-connect.options";
/**
 * This provider is responsible for loading all user-definable configuration parameters (imported from
 * environment variables) and making them available to all necessary app services
 */
@Injectable()
export class TaxiiConfigService implements TaxiiConfigServiceInterface {
  constructor(private configService: ConfigService) {}

  createAppConnectOptions(): AppConnectOptions {
    return {
      databaseConnectOptions: this.createDatabaseConnectOptions(),
      stixConnectOptions: this.createStixConnectOptions(),
    };
  }

  createHydrateConnectOptions(): HydrateConnectOptions {
    return {
      hydrateOnBoot: this.HYDRATE_ON_BOOT,
      ...this.createAppConnectOptions(),
    };
  }

  createDatabaseConnectOptions(): DatabaseConnectOptions {
    return {
      mongoUri: this.MONGO_URI,
    };
  }

  createStixConnectOptions(): StixConnectOptions {
    return {
      workbench: {
        baseUrl: this.WORKBENCH_REST_API_URL,
        authorization: this.WORKBENCH_AUTH_HEADER
      },
    };
  }

  get APP_ADDRESS(): string {
    return this.configService.get<string>("app.address");
  }

  get APP_PORT(): number {
    return this.configService.get<number>("app.port");
  }

  get APP_PORT_HTTPS(): number {
    return this.configService.get<number>("app.portHttps");
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

  get CONTACT_EMAIL(): string {
    return this.configService.get<string>("app.contact");
  }

  get CORS_ENABLED(): boolean {
    return this.configService.get<string>("app.corsEnabled") === "true";
  }

  get WORKBENCH_REST_API_URL(): string {
    return this.configService.get<string>("app.workbenchRestApiUrl");
  }

  get WORKBENCH_AUTH_HEADER(): string {
    return this.configService.get<string>("app.workbenchAuthHeader");
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
    return this.configService.get<string>("app.logToFile") === "true";
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

  get ENV(): string {
    return this.configService.get<string>("app.env");
  }

  get MONGO_URI(): string {
    return this.configService.get<string>("app.mongoUri");
  }

  get HYDRATE_ON_BOOT(): boolean {
    return this.configService.get<string>("app.hydrateOnBoot") === "true";
  }
}
