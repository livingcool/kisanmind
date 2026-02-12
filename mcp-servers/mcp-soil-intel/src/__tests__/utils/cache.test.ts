/**
 * Unit tests for Cache Manager utility
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CacheManager } from '../../utils/cache.js';

describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager(60000); // 1 minute TTL for tests
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve values', () => {
      const testValue = { data: 'test', number: 123 };
      cache.set('test-key', testValue);

      const retrieved = cache.get<typeof testValue>('test-key');
      expect(retrieved).toEqual(testValue);
    });

    it('should return undefined for non-existent keys', () => {
      const result = cache.get('non-existent');
      expect(result).toBeUndefined();
    });

    it('should check if key exists', () => {
      cache.set('exists', 'value');

      expect(cache.has('exists')).toBe(true);
      expect(cache.has('does-not-exist')).toBe(false);
    });

    it('should delete cached values', () => {
      cache.set('to-delete', 'value');
      expect(cache.has('to-delete')).toBe(true);

      cache.delete('to-delete');
      expect(cache.has('to-delete')).toBe(false);
    });

    it('should clear all cached values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(true);

      cache.clear();

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(false);
    });
  });

  describe('Custom TTL', () => {
    it('should support custom TTL per key', () => {
      cache.set('short-lived', 'value', 100); // 100ms TTL
      expect(cache.has('short-lived')).toBe(true);
    });

    it('should create cache with default 30-day TTL', () => {
      const longCache = new CacheManager(); // Default TTL
      longCache.set('long-lived', 'value');
      expect(longCache.has('long-lived')).toBe(true);
    });
  });

  describe('Coordinate Key Generation', () => {
    it('should generate cache key from coordinates', () => {
      const key = CacheManager.coordKey(20.9374, 77.7796);
      expect(key).toBe(':20.9374,77.7796');
    });

    it('should generate cache key with prefix', () => {
      const key = CacheManager.coordKey(20.9374, 77.7796, 'soilgrids');
      expect(key).toBe('soilgrids:20.9374,77.7796');
    });

    it('should round coordinates to 4 decimal places for cache efficiency', () => {
      // Coordinates with more than 4 decimal places should be rounded
      const key1 = CacheManager.coordKey(20.937456789, 77.779612345);
      const key2 = CacheManager.coordKey(20.937450001, 77.779607890);

      // Both should round to the same key (within ~11m precision)
      expect(key1).toBe(':20.9375,77.7796');
      expect(key2).toBe(':20.9375,77.7796');
    });

    it('should handle negative coordinates', () => {
      const key = CacheManager.coordKey(-20.9374, -77.7796, 'test');
      expect(key).toBe('test:-20.9374,-77.7796');
    });

    it('should handle zero coordinates', () => {
      const key = CacheManager.coordKey(0, 0);
      expect(key).toBe(':0,0');
    });
  });

  describe('Cache Statistics', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.get('key1');
      cache.get('key1');
      cache.get('non-existent');

      const stats = cache.getStats();
      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
    });
  });

  describe('Data Integrity', () => {
    it('should not clone objects by default (useClones: false)', () => {
      const testObject = { mutable: 'original' };
      cache.set('test', testObject);

      const retrieved = cache.get<typeof testObject>('test');
      expect(retrieved).toBe(testObject); // Same reference
    });

    it('should handle null values', () => {
      cache.set('null-value', null);
      const retrieved = cache.get('null-value');
      expect(retrieved).toBeNull();
    });

    it('should handle undefined values', () => {
      cache.set('undefined-value', undefined);
      const retrieved = cache.get('undefined-value');
      expect(retrieved).toBeUndefined();
    });

    it('should handle complex nested objects', () => {
      const complexObject = {
        level1: {
          level2: {
            array: [1, 2, 3],
            string: 'test',
            nested: { value: 42 }
          }
        }
      };

      cache.set('complex', complexObject);
      const retrieved = cache.get<typeof complexObject>('complex');
      expect(retrieved).toEqual(complexObject);
    });
  });
});
