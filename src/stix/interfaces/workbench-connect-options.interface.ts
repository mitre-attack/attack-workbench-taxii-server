export interface WorkbenchConnectOptionsInterface {
  baseUrl?: string;

  // A base-64 encoded Basic Authorization header for authenticating to the Workbench REST API
  authorization?: string;

  // The expiration time for each entry in the cache
  cacheTtl: number;
}
