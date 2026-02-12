import NodeCache from 'node-cache';

/**
 * Cache manager for water data
 */
export class CacheManager {
  private cache: NodeCache;

  constructor(ttl: number = 7 * 24 * 60 * 60 * 1000) {
    this.cache = new NodeCache({
      stdTTL: ttl / 1000,
      checkperiod: 600,
      useClones: false,
    });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl) {
      return this.cache.set(key, value, ttl / 1000);
    }
    return this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): number {
    return this.cache.del(key);
  }

  clear(): void {
    this.cache.flushAll();
  }

  getStats() {
    return this.cache.getStats();
  }

  static coordKey(lat: number, lng: number, prefix: string = ''): string {
    const roundedLat = Math.round(lat * 10000) / 10000;
    const roundedLng = Math.round(lng * 10000) / 10000;
    return `${prefix}:${roundedLat},${roundedLng}`;
  }
}
