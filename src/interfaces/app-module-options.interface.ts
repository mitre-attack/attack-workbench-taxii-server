import {StixConnectOptions} from "../stix/interfaces";
import {CacheConnectOptions} from "../cache/interfaces/cache-module-options.interface";

export interface AppConnectOptions {
    /**
     * The properties required to dynamically instantiate a StixModule
     */
    stixConnectOptions: StixConnectOptions;
    /**
     * The properties required to dynamically instantiate a TaxiiCacheModule
     */
    cacheConnectOptions: CacheConnectOptions;
}