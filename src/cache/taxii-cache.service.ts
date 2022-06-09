import {CACHE_OPTIONS} from "./constants";
import {CacheModule, DynamicModule, Inject, Injectable} from "@nestjs/common";
import {CACHE_CONNECT_OPTIONS} from "./taxii-cache.module";
import {Cache} from "cache-manager";

// ** memcached dependencies ** //
import * as Memcache from "memcache-pp"
import * as memcachedStore from "cache-manager-memcached-store"


@Injectable()
export class TaxiiCacheService {

    private readonly _cache: Cache;

    constructor(@Inject(CACHE_CONNECT_OPTIONS) private _cacheConnectOptions) {}

    async connect() : Promise<any> {
        return this._cache
            ? this._cache
            : await this.initialize(this._cacheConnectOptions);
    }

    public async initialize(cacheConnectOptions) {

        switch(cacheConnectOptions) {

            case CACHE_OPTIONS.MEMCACHED: {
                return TaxiiCacheService.useMemcachedCache(cacheConnectOptions);
            }

            default:
                return TaxiiCacheService.useDefaultCache(cacheConnectOptions);
        }
    }

    private static async useDefaultCache(connectOptions) : Promise<DynamicModule> {
        return CacheModule.register({
            isGlobal: true,
            ttl: connectOptions.ttl
        });
    }

    private static async useMemcachedCache(connectOptions) : Promise<DynamicModule> {
            return CacheModule.register({
                isGlobal: true,
                store: memcachedStore,
                driver: Memcache,
                // http://memcache-plus.com/initialization.html - see options
                options: {
                    hosts: [connectOptions.host],
                    maxValueSize: connectOptions.maxValueSize,  // 52428800 == 50m or 50MB
                                                                // 10485760 == 10m or 10MB
                    reconnect: true
                },
                ttl: connectOptions.ttl
            })
    }
}