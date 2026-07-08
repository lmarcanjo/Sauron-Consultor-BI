/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Structural item wrapping cached objects with validation timestamps.
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessAt: number;
  sequence: number;
}

/**
 * Stats metadata for observability.
 */
export interface CacheStats {
  hits: number;
  misses: number;
  totalEntries: number;
  evictionCount: number;
}

/**
 * Generic LRU Cache with TTL.
 */
export class DomainCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  private sequenceCounter = 0;

  constructor(
    private name: string,
    private maxEntries: number = 200,
    private ttlMs: number = 10 * 60 * 1000 // default 10 minutes
  ) {}

  public get(key: string): T | null {
    const entry = this.store.get(key);
    const now = Date.now();

    if (!entry) {
      this.misses++;
      return null;
    }

    if (now > entry.expiresAt) {
      // Entry expired, delete it
      this.store.delete(key);
      this.misses++;
      return null;
    }

    // Hit! Update access time for LRU tracking
    entry.lastAccessAt = now;
    entry.sequence = ++this.sequenceCounter;
    this.hits++;
    return entry.value;
  }

  public set(key: string, value: T): void {
    const now = Date.now();

    // LRU eviction if full
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      this.evictLRU();
    }

    this.store.set(key, {
      value,
      expiresAt: now + this.ttlMs,
      lastAccessAt: now,
      sequence: ++this.sequenceCounter,
    });
  }

  public remove(key: string): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  public getStats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      totalEntries: this.store.size,
      evictionCount: this.evictions,
    };
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let lowestSequence = Infinity;

    for (const [key, entry] of this.store.entries()) {
      if (entry.sequence < lowestSequence) {
        lowestSequence = entry.sequence;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
      this.evictions++;
      console.log(`[Cache:${this.name}] Evicted oldest entry key [${oldestKey}] to enforce memory limits.`);
    }
  }
}

// ============================================================================
// DOMAIN-SPECIFIC CACHES
// ============================================================================

export class SessionCache extends DomainCache<any> {
  constructor() {
    super("SessionCache", 50, 5 * 60 * 1000); // 5 minutes TTL for user tokens
  }
}

export class AnalyticsCache extends DomainCache<any> {
  constructor() {
    super("AnalyticsCache", 300, 30 * 60 * 1000); // 30 minutes TTL for compiled charts
  }
}

export class StoryCache extends DomainCache<any> {
  constructor() {
    super("StoryCache", 100, 15 * 60 * 1000); // 15 minutes TTL for strategic story chapters
  }
}

export class MetadataCache extends DomainCache<any> {
  constructor() {
    super("MetadataCache", 500, 24 * 60 * 60 * 1000); // 24 hours TTL for slow schemas
  }
}

/**
 * Centralized Domain Cache registry.
 */
class CentralCacheRegistry {
  public session = new SessionCache();
  public analytics = new AnalyticsCache();
  public story = new StoryCache();
  public metadata = new MetadataCache();

  public flushAll(): void {
    this.session.clear();
    this.analytics.clear();
    this.story.clear();
    this.metadata.clear();
  }

  public getAllStats(): Record<string, CacheStats> {
    return {
      session: this.session.getStats(),
      analytics: this.analytics.getStats(),
      story: this.story.getStats(),
      metadata: this.metadata.getStats(),
    };
  }
}

export const cacheRegistry = new CentralCacheRegistry();
export default cacheRegistry;
