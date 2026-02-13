/**
 * Audio Cache Manager
 *
 * Manages pre-generated audio files and an in-memory LRU cache for
 * frequently accessed TTS results. Handles cache warming on startup
 * and cache invalidation.
 */

import { type SupportedLanguage } from './translations.js';
import { type TTSResult } from './tts-engine.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CacheEntry {
  result: TTSResult;
  accessedAt: number;
  accessCount: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
}

// ---------------------------------------------------------------------------
// Audio Cache
// ---------------------------------------------------------------------------

export class AudioCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize: number = 200) {
    this.maxSize = maxSize;
  }

  /**
   * Build a cache key from instruction ID and language.
   */
  private buildKey(instructionId: string, language: SupportedLanguage): string {
    return `${language}:${instructionId}`;
  }

  /**
   * Get a cached TTS result.
   */
  get(instructionId: string, language: SupportedLanguage): TTSResult | null {
    const key = this.buildKey(instructionId, language);
    const entry = this.cache.get(key);

    if (entry) {
      this.hits++;
      entry.accessedAt = Date.now();
      entry.accessCount++;
      return entry.result;
    }

    this.misses++;
    return null;
  }

  /**
   * Store a TTS result in the cache.
   */
  set(instructionId: string, language: SupportedLanguage, result: TTSResult): void {
    const key = this.buildKey(instructionId, language);

    // Evict least recently accessed entry if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      result,
      accessedAt: Date.now(),
      accessCount: 1,
    });
  }

  /**
   * Remove the least recently used entry.
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.accessedAt < oldestTime) {
        oldestTime = entry.accessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Check if an entry exists in the cache.
   */
  has(instructionId: string, language: SupportedLanguage): boolean {
    return this.cache.has(this.buildKey(instructionId, language));
  }

  /**
   * Remove a specific entry from the cache.
   */
  invalidate(instructionId: string, language: SupportedLanguage): void {
    this.cache.delete(this.buildKey(instructionId, language));
  }

  /**
   * Clear all cache entries.
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? Math.round((this.hits / total) * 100) / 100 : 0,
    };
  }
}

// Singleton instance
let cacheInstance: AudioCache | null = null;

export function getAudioCache(maxSize?: number): AudioCache {
  if (!cacheInstance) {
    cacheInstance = new AudioCache(maxSize);
  }
  return cacheInstance;
}
