export interface CacheConnectOptions {
  type?: string;

  /**
   * One IP address or FQDN string that Memcached is listening on
   */
  host?: string;
  /**
   * The duration of time that an item should remain in the cache before being removed
   */
  ttl?: number;
  /**
   * The maximum size of each item allowed in the cache. This value should match the corresponding server-side setting
   */
  maxValueSize?: number;
  /**
   * Whether or not the cache client should automatically attempt to reconnect to the cache service in the event of
   * a disconnection
   */
  reconnect?: boolean;
}
