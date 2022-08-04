export interface TaxiiConfigServiceInterface {
  createCacheConnectOptions();
  createStixConnectOptions();
  get APP_ADDRESS();
  get APP_PORT();
  get MAX_CONTENT_LENGTH();
  get API_ROOT_PATH();
  get API_ROOT_TITLE();
  get API_ROOT_DESCRIPTION();
  get CONTACT();
  get CACHE_TYPE();
  get CACHE_HOST();
  get CACHE_PORT();
  get CACHE_TTL();
  get CACHE_MAX_SIZE();
  get CACHE_RECONNECT();
  get CORS_ENABLED();
  get WORKBENCH_REST_API_URL();
  get WORKBENCH_AUTH_HEADER();
  get STIX_DATA_SRC();
  get HTTPS_ENABLED();
  get SSL_PRIVATE_KEY();
  get SSL_PUBLIC_KEY();
  get LOG_LEVEL();
  get LOG_TO_HTTP_HOST();
  get LOG_TO_HTTP_PATH();
  get LOG_TO_SLACK_URL();
  get LOG_TO_SENTRY_DSN();
}
