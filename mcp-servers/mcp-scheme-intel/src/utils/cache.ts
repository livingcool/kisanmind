import NodeCache from 'node-cache';

/**
 * Cache manager for government scheme data (changes slowly, can be cached for extended periods)
 */
export class CacheManager {
  private cache: NodeCache;

  /**
   * @param ttl Time to live in milliseconds (default: 24 hours for scheme data)
   */
  constructor(ttl: number = 24 * 60 * 60 * 1000) {
    this.cache = new NodeCache({
      stdTTL: ttl / 1000, // NodeCache uses seconds
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false, // Don't clone objects for better performance
    });
  }

  /**
   * Get cached value
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Set cached value
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl) {
      return this.cache.set(key, value, ttl / 1000);
    }
    return this.cache.set(key, value);
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete cached value
   */
  delete(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.flushAll();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Generate cache key from coordinates
   */
  static coordKey(lat: number, lng: number, prefix: string = ''): string {
    // Round to 2 decimal places for state-level precision
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLng = Math.round(lng * 100) / 100;
    return `${prefix}:${roundedLat},${roundedLng}`;
  }
}
