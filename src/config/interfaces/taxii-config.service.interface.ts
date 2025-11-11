export interface TaxiiConfigServiceInterface {
  createAppConnectOptions();
  createHydrateConnectOptions();
  createDatabaseConnectOptions();
  createStixConnectOptions();
  get APP_ADDRESS();
  get APP_PORT();
  get APP_PORT_HTTPS();
  get MAX_CONTENT_LENGTH();
  get API_ROOT_PATH();
  get API_ROOT_TITLE();
  get API_ROOT_DESCRIPTION();
  get CONTACT_EMAIL();
  get CORS_ENABLED();
  get WORKBENCH_REST_API_URL();
  get WORKBENCH_AUTH_HEADER();
  get HTTPS_ENABLED();
  get SSL_PRIVATE_KEY();
  get SSL_PUBLIC_KEY();
  get LOG_LEVEL();
  get LOG_TO_HTTP_HOST();
  get LOG_TO_HTTP_PATH();
  get LOG_TO_SLACK_URL();
  get LOG_TO_SENTRY_DSN();
  get MONGO_URI();
  get ENV();
  get HYDRATE_ON_BOOT();
}
