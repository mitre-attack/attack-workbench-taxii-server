import { StixConnectOptions } from "src/stix/interfaces";
import { DatabaseConnectOptions } from "src/interfaces/database-connect-options.interface";

export interface CollectorConnectOptions {
  hydrateOnBoot: boolean;
  databaseConnectOptions: DatabaseConnectOptions;
  stixConnectOptions: StixConnectOptions;
}
