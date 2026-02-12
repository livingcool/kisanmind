import NodeCache from 'node-cache';

export class CacheManager {
  private cache: NodeCache;
  constructor(ttl: number = 3 * 60 * 60 * 1000) {
    this.cache = new NodeCache({ stdTTL: ttl / 1000, checkperiod: 600, useClones: false });
  }
  get<T>(key: string): T | undefined { return this.cache.get<T>(key); }
  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl) return this.cache.set(key, value, ttl / 1000);
    return this.cache.set(key, value);
  }
  has(key: string): boolean { return this.cache.has(key); }
  static coordKey(lat: number, lng: number, prefix: string = ''): string {
    return `${prefix}:${Math.round(lat * 10000) / 10000},${Math.round(lng * 10000) / 10000}`;
  }
}
