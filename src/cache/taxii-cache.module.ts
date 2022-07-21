import { CacheModule, DynamicModule, Global, Module } from "@nestjs/common";
import { CACHE_OPTIONS } from "./constants";

// ** memcached dependencies ** //
import * as Memcache from "memcache-pp";
import * as memcachedStore from "cache-manager-memcached-store";

// ** interfaces ** //
import { CacheConnectOptions } from "./interfaces/cache-module-options.interface";

// ** tokens ** //
export const CACHE_CONNECT_OPTIONS = "CACHE_CONNECT_OPTIONS";

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
            hosts: [options.host],
            maxValueSize: options.maxValueSize, // 52428800 == 50m or 50MB, 10485760 == 10m or 10MB
            reconnect: options.reconnect,
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
