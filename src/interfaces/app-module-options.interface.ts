import { StixConnectOptions } from "../stix/interfaces";
import { CacheConnectOptions } from "../cache/interfaces/cache-module-options.interface";
import { DatabaseConnectOptions } from "./database-connect-options.interface";

export interface AppConnectOptions {
  /**
   * The properties required to dynamically instantiate a StixModule
   */
  stixConnectOptions: StixConnectOptions;
  /**
   * The properties required to dynamically instantiate a TaxiiCacheModule
   */
  cacheConnectOptions: CacheConnectOptions;
  /**
   * The properties required to dynamically connect to the target MongoDB instance
   */
  databaseConnectOptions: DatabaseConnectOptions;
}
