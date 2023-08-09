import { registerAs } from "@nestjs/config";
import * as Joi from "@hapi/joi";
import * as DEFAULTS from "./defaults";

export const configuration = registerAs("app", () => ({
  env:                        process.env.TAXII_ENV                   || DEFAULTS.DEFAULT_ENV,
  address:                    process.env.TAXII_APP_ADDRESS           || DEFAULTS.DEFAULT_APP_ADDRESS,
  port:                       process.env.TAXII_APP_PORT              || DEFAULTS.DEFAULT_APP_PORT,
  maxContentLength:           process.env.TAXII_MAX_CONTENT_LENGTH    || DEFAULTS.DEFAULT_MAX_CONTENT_LENGTH,
  apiRootPath:                process.env.TAXII_API_ROOT_PATH         || DEFAULTS.DEFAULT_API_ROOT_PATH,
  apiRootTitle:               process.env.TAXII_API_ROOT_TITLE        || DEFAULTS.DEFAULT_API_ROOT_TITLE,
  apiRootDescription:         process.env.TAXII_API_ROOT_DESCRIPTION  || DEFAULTS.DEFAULT_API_ROOT_DESCRIPTION,
  contactEmail:               process.env.TAXII_CONTACT_EMAIL         || DEFAULTS.DEFAULT_CONTACT_EMAIL,
  workbenchRestApiUrl:        process.env.TAXII_STIX_SRC_URL          || DEFAULTS.DEFAULT_WORKBENCH_REST_API_URL,
  workbenchAuthHeader:        process.env.TAXII_WORKBENCH_AUTH_HEADER || DEFAULTS.DEFAULT_WORKBENCH_AUTH_HEADER,
  logLevel:                   process.env.TAXII_LOG_LEVEL             || DEFAULTS.DEFAULT_LOG_LEVEL,
  logToFile:                  process.env.TAXII_LOG_TO_FILE           || DEFAULTS.DEFAULT_LOG_TO_FILE,
  mongoUri:                   process.env.TAXII_MONGO_URI             || DEFAULTS.DEFAULT_MONGO_URI,
  corsEnabled:                process.env.TAXII_CORS_ENABLED,         // boolean will default to false
  httpsEnabled:               process.env.TAXII_HTTPS_ENABLED,        // boolean will default to false
  hydrateOnBoot:              process.env.TAXII_HYDRATE_ON_BOOT,      // boolean will default to false
  logToHttpHost:              process.env.TAXII_LOG_TO_HTTP_HOST,     // no default key
  logToHttpPort:              process.env.TAXII_LOG_TO_HTTP_PORT,     // no default key
  logToHttpPath:              process.env.TAXII_LOG_TO_HTTP_PATH,     // no default key
  logToSlackUrl:              process.env.TAXII_LOG_TO_SLACK_URL,     // no default key
  logToSentryDsn:             process.env.TAXII_LOG_TO_SENTRY_DSN,    // no default key
  sslPrivateKeyBase64Encoded: process.env.TAXII_SSL_PRIVATE_KEY,      // no default key
  sslPublicKeyBase64Encoded:  process.env.TAXII_SSL_PUBLIC_KEY,       // no default key
}));

export const validationSchema = Joi.object({

  ENV: Joi
      .string()
      .default(DEFAULTS.DEFAULT_ENV)
      .valid("dev", "prod"),

  APP_ADDRESS: Joi
      .string()
      .default(DEFAULTS.DEFAULT_APP_ADDRESS),

  APP_PORT: Joi
      .number()
      .default(DEFAULTS.DEFAULT_APP_PORT),

  MAX_CONTENT_LENGTH: Joi
      .number()
      .default(DEFAULTS.DEFAULT_MAX_CONTENT_LENGTH),

  API_ROOT_PATH: Joi
      .string()
      .default(DEFAULTS.DEFAULT_API_ROOT_PATH),

  API_ROOT_TITLE: Joi
      .string()
      .default(DEFAULTS.DEFAULT_API_ROOT_TITLE),

  API_ROOT_DESCRIPTION: Joi
      .string()
      .default(DEFAULTS.DEFAULT_API_ROOT_DESCRIPTION),

  CONTACT_EMAIL: Joi
      .string()
      .email()
      .default(DEFAULTS.DEFAULT_CONTACT_EMAIL),

  CORS_ENABLED: Joi
      .boolean()
      .default(DEFAULTS.DEFAULT_CORS_ENABLED),

  WORKBENCH_REST_API_URL: Joi
      .string()
      .default(DEFAULTS.DEFAULT_WORKBENCH_REST_API_URL),

  WORKBENCH_AUTH_HEADER: Joi
      .string()
      .default(DEFAULTS.DEFAULT_WORKBENCH_AUTH_HEADER),

  LOG_LEVEL: Joi
      .string()
      .valid("log", "error", "warn", "debug", "verbose")
      .default(DEFAULTS.DEFAULT_LOG_LEVEL),

  LOG_TO_FILE: Joi
      .boolean()
      .default(DEFAULTS.DEFAULT_LOG_TO_FILE),

  LOG_TO_HTTP_HOST: Joi
      .string(),

  LOG_TO_HTTP_PORT: Joi
      .number()
      .min(1)
      .max(65535),

  LOG_TO_HTTP_PATH: Joi
      .string()
      .uri({ allowRelative: true }),

  LOG_TO_SLACK_URL: Joi
      .string()
      .uri(),

  LOG_TO_SENTRY_DSN: Joi
      .string()
      .uri(),

  HTTPS_ENABLED: Joi
      .boolean()
      .default(DEFAULTS.DEFAULT_HTTPS_ENABLED),

  SSL_PRIVATE_KEY: Joi
      .string()
      .base64(),

  SSL_PUBLIC_KEY: Joi
      .string()
      .base64(),

  MONGO_URI: Joi
      .string()
      .default(DEFAULTS.DEFAULT_MONGO_URI),

  HYDRATE_ON_BOOT: Joi
      .boolean()
      .default(DEFAULTS.DEFAULT_HYDRATE_ON_BOOT)
});
