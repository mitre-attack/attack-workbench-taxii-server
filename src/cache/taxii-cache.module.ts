import { CacheModule, DynamicModule, Global, Module } from "@nestjs/common";
import { CACHE_OPTIONS } from "./constants";

// ** memcached dependencies ** //
import * as Memcache from "@feedfm/memcache-plus";
import * as memcachedStore from "cache-manager-memcached-store";

// ** interfaces ** //
import { CacheConnectOptions } from "./interfaces/cache-module-options.interface";

@Global()
@Module({})
export class TaxiiCacheModule {
  public static forRoot(connectOptions: CacheConnectOptions): DynamicModule {
    return TaxiiCacheModule.createCacheProviders(connectOptions);
  }

  private static createCacheProviders(
    options: CacheConnectOptions
  ): DynamicModule {
    switch (options.type) {
      case CACHE_OPTIONS.MEMCACHED: {
        return CacheModule.register({
          isGlobal: true,
          store: memcachedStore,
          driver: Memcache,
          // http://memcache-plus.com/initialization.html - see options
          options: {
            hosts: [options.host], // the address of the memcached server
            maxValueSize: options.maxValueSize, // the maximum size of a given cache entry
            reconnect: options.reconnect, // whether the client should attempt to reconnect if there is a disconnect
            netTimeout: 6000, // the amount of time (ms) the client will wait for a response
          },
          ttl: options.ttl,
        });
      }

      default: {
        return CacheModule.register({
          isGlobal: true,
          ttl: options.ttl,
        });
      }
    }
  }
}
