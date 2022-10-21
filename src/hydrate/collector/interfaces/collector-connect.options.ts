import { StixConnectOptions } from "src/stix/interfaces";
import { CacheConnectOptions } from "src/cache/interfaces/cache-module-options.interface";
import { DatabaseConnectOptions } from "src/interfaces/database-connect-options.interface";

export interface CollectorConnectOptions {
  hydrateOnBoot: boolean;
  databaseConnectOptions: DatabaseConnectOptions;
  stixConnectOptions: StixConnectOptions;
  cacheConnectOptions: CacheConnectOptions;
}
