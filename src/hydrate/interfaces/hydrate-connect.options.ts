import { StixConnectOptions } from "src/stix/interfaces";
import { DatabaseConnectOptions } from "src/interfaces/database-connect-options.interface";

/**
 * Configuration options for the Hydrate module.
 * 
 * @property hydrateOnBoot - If true, triggers hydration process when the application starts
 * @property databaseConnectOptions - MongoDB connection configuration
 * @property stixConnectOptions - Configuration for connecting to Workbench
 */
export interface HydrateConnectOptions {
    hydrateOnBoot: boolean;
    databaseConnectOptions: DatabaseConnectOptions;
    stixConnectOptions: StixConnectOptions;
}