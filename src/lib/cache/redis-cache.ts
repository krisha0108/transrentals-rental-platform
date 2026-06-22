/**
 * Redis Cache Utility for Production
 *
 * Provides a simple caching layer with Redis for production environments.
 * Falls back to in-memory cache if Redis is unavailable.
 *
 * SETUP:
 * 1. Install ioredis: npm install ioredis
 * 2. Set REDIS_URL environment variable
 *
 * Usage:
 * ```typescript
 * import { cache } from '@/lib/cache/redis-cache';
 *
 * // Get or set with factory function
 * const data = await cache.getOrSet('key', () => fetchData(), 3600);
 *
 * // Manual get/set
 * await cache.set('key', data, 3600);
 * const cached = await cache.get('key');
 *
 * // Invalidate
 * await cache.del('key');
 * await cache.delPattern('prefix:*');
 * ```
 */

import logger from '@/lib/security/logger';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class RedisCache {
  private redis: any = null;
  private useInMemory: boolean = true;
  private inMemoryStore: Map<string, CacheEntry<any>> = new Map();
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initRedis();
  }

  private async initRedis(): Promise<void> {
    // Don't attempt Redis in browser environments
    if (typeof window !== 'undefined') {
      this.useInMemory = true;
      return;
    }

    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      logger.warn('REDIS_URL not set, using in-memory cache');
      return;
    }

    try {
      const Redis = (await import('ioredis')).default;
      this.redis = new Redis(redisUrl);
      this.useInMemory = false;
      logger.info('Redis cache connected');
    } catch (error) {
      logger.error('Failed to connect to Redis cache', error);
      this.useInMemory = true;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
      this.initPromise = null;
    }
  }

  /**
   * Get a cached value
   */
  async get<T>(key: string): Promise<T | null> {
    await this.ensureInitialized();

    if (this.useInMemory) {
      return this.getInMemory<T>(key);
    }

    return this.getRedis<T>(key);
  }

  private getInMemory<T>(key: string): T | null {
    const entry = this.inMemoryStore.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.inMemoryStore.delete(key);
      return null;
    }

    return entry.value as T;
  }

  private async getRedis<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(`cache:${key}`);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error('Redis cache get error', error);
      return null;
    }
  }

  /**
   * Set a cached value
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds (default: 5 minutes)
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    await this.ensureInitialized();

    if (this.useInMemory) {
      this.setInMemory(key, value, ttlSeconds);
      return;
    }

    await this.setRedis(key, value, ttlSeconds);
  }

  private setInMemory<T>(key: string, value: T, ttlSeconds: number): void {
    this.inMemoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    // Cleanup expired entries periodically
    if (Math.random() < 0.01) {
      this.cleanupInMemory();
    }
  }

  private async setRedis<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.setex(`cache:${key}`, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      logger.error('Redis cache set error', error);
    }
  }

  /**
   * Get or set a cached value with a factory function
   * @param key Cache key
   * @param factory Function to generate value if not cached
   * @param ttlSeconds Time to live in seconds
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlSeconds: number = 300): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Delete a cached value
   */
  async del(key: string): Promise<void> {
    await this.ensureInitialized();

    if (this.useInMemory) {
      this.inMemoryStore.delete(key);
      return;
    }

    try {
      await this.redis.del(`cache:${key}`);
    } catch (error) {
      logger.error('Redis cache del error', error);
    }
  }

  /**
   * Delete all keys matching a pattern
   * @param pattern Glob pattern (e.g., "users:*")
   */
  async delPattern(pattern: string): Promise<void> {
    await this.ensureInitialized();

    if (this.useInMemory) {
      for (const key of this.inMemoryStore.keys()) {
        if (this.matchPattern(key, pattern)) {
          this.inMemoryStore.delete(key);
        }
      }
      return;
    }

    try {
      const keys = await this.redis.keys(`cache:${pattern}`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error('Redis cache delPattern error', error);
    }
  }

  private matchPattern(key: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return regex.test(key);
  }

  private cleanupInMemory(): void {
    const now = Date.now();
    for (const [key, entry] of this.inMemoryStore.entries()) {
      if (now > entry.expiresAt) {
        this.inMemoryStore.delete(key);
      }
    }
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return !this.useInMemory && this.redis?.status === 'ready';
  }

  /**
   * Get cache stats
   */
  getStats(): { type: 'redis' | 'memory'; size: number } {
    return {
      type: this.useInMemory ? 'memory' : 'redis',
      size: this.useInMemory ? this.inMemoryStore.size : -1,
    };
  }
}

// Export singleton instance
export const cache = new RedisCache();

// Cache key builders for consistent naming
export const cacheKeys = {
  // Location cache keys
  locations: (type?: string) => (type ? `locations:${type}` : 'locations:all'),
  location: (slug: string) => `location:${slug}`,

  // Fleet cache keys
  fleet: (category?: string, location?: string) =>
    `fleet:${category || 'all'}:${location || 'all'}`,
  fleetItem: (id: string) => `fleet:item:${id}`,

  // Service cache keys
  services: () => 'services:all',
  service: (slug: string) => `service:${slug}`,

  // Trip types and packages
  tripTypes: () => 'trip-types:all',
  localPackages: () => 'local-packages:all',

  // Vendor data
  vendorFleet: (vendorId: string) => `vendor:${vendorId}:fleet`,
  vendorApprovedServices: (vendorId: string) => `vendor:${vendorId}:services`,
  vendorApprovedLocations: (vendorId: string) => `vendor:${vendorId}:locations`,

  // Vehicle models and brands
  vehicleModels: () => 'vehicle-models:all',
  brands: () => 'brands:all',
  vehicleCategories: () => 'vehicle-categories:all',
};

// Cache TTL constants (in seconds)
export const cacheTTL = {
  SHORT: 60, // 1 minute - for frequently changing data
  MEDIUM: 300, // 5 minutes - default
  LONG: 1800, // 30 minutes - for semi-static data
  HOUR: 3600, // 1 hour - for static data
  DAY: 86400, // 24 hours - for rarely changing data
};

export default cache;
