import {STIX_REPO_TYPE} from "../stix/constants";
import {CACHE_OPTIONS} from "../cache/constants";

export const DEFAULT_APP_ADDRESS = '0.0.0.0';
export const DEFAULT_APP_PORT = 5000;
export const DEFAULT_MAX_CONTENT_LENGTH = 1000;
export const DEFAULT_API_ROOT_PATH = 'v2.1/api';
export const DEFAULT_API_ROOT_TITLE = 'MITRE ATT&CK TAXII 2.1';
export const DEFAULT_API_ROOT_DESCRIPTION = 'This API Root contains TAXII 2.1 REST API endpoints that serve MITRE ATT&CK STIX 2.1 data';
export const DEFAULT_CONTACT = 'no-reply@your-company.tld';
export const DEFAULT_CACHE_TYPE = CACHE_OPTIONS.DEFAULT;
export const DEFAULT_CACHE_HOST = "localhost";
export const DEFAULT_CACHE_PORT = 6379;
export const DEFAULT_CACHE_TTL = 600; // measured in seconds, 600s => 10min
export const DEFAULT_CACHE_MAX_ITEM_SIZE = '50m'; // approx. 10x size of entire Enterprise ATT&CK collection paginated by 100
export const DEFAULT_CACHE_RECONNECT = true;
export const DEFAULT_CORS_ENABLED = false;
export const DEFAULT_WORKBENCH_REST_API_URL = 'http://localhost:3000';
export const DEFAULT_STIX_DATA_SRC = STIX_REPO_TYPE.WORKBENCH;
export const DEFAULT_LOG_LEVEL = 'info';
export const DEFAULT_LOG_TO_FILE = false;
export const DEFAULT_HTTPS_ENABLED = true;