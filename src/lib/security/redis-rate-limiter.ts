/**
 * Redis-based Rate Limiter for Production
 *
 * This module provides a Redis-backed rate limiter for production environments
 * where multiple server instances need to share rate limiting state.
 *
 * SETUP INSTRUCTIONS:
 *
 * 1. Install Redis package:
 *    npm install ioredis
 *
 * 2. Set environment variables:
 *    REDIS_URL=redis://localhost:6379
 *    # Or for Redis Cloud/Upstash:
 *    REDIS_URL=redis://default:password@host:port
 *
 * 3. For Upstash (serverless Redis), install:
 *    npm install @upstash/redis
 *
 * Usage Example:
 * ```typescript
 * import { redisRateLimiter } from '@/lib/security/redis-rate-limiter';
 *
 * // In API route
 * const result = await redisRateLimiter.checkLimit(ip, 'api');
 * if (!result.allowed) {
 *   return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
 * }
 * ```
 */

// Type definitions for when Redis is available
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

type RateLimitType = 'api' | 'auth' | 'otp' | 'payment' | 'upload';

// Default limits per type
const RATE_LIMITS: Record<RateLimitType, RateLimitConfig> = {
  api: { windowMs: 60 * 1000, maxRequests: 100 },        // 100 req/min
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },    // 5 attempts/15min
  otp: { windowMs: 60 * 1000, maxRequests: 3 },          // 3 OTP/min
  payment: { windowMs: 60 * 1000, maxRequests: 10 },     // 10 payments/min
  upload: { windowMs: 60 * 1000, maxRequests: 20 },      // 20 uploads/min
};

/**
 * Redis Rate Limiter Implementation
 *
 * Uses Redis MULTI/EXEC for atomic operations and sliding window algorithm.
 * Falls back to in-memory rate limiting if Redis is not available.
 */
class RedisRateLimiter {
  private redis: any = null;
  private useInMemory: boolean = true;
  private inMemoryStore: Map<string, { count: number; resetAt: number }> = new Map();

  constructor() {
    this.initRedis();
  }

  private async initRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.warn('[RateLimiter] REDIS_URL not set, using in-memory rate limiting');
      return;
    }

    try {
      // Dynamic import to avoid errors if ioredis is not installed
      const Redis = await import('ioredis').then(m => m.default).catch(() => null);

      if (!Redis) {
        console.warn('[RateLimiter] ioredis not installed, using in-memory rate limiting');
        return;
      }

      this.redis = new Redis(redisUrl);

      await this.redis.connect();
      this.useInMemory = false;
      console.info('[RateLimiter] Redis connected successfully');
    } catch (error) {
      console.error('[RateLimiter] Failed to connect to Redis, using in-memory:', error);
      this.useInMemory = true;
    }
  }

  /**
   * Check if request is within rate limits
   */
  async checkLimit(
    identifier: string,
    type: RateLimitType = 'api'
  ): Promise<RateLimitResult> {
    const config = RATE_LIMITS[type];
    const key = `ratelimit:${type}:${identifier}`;

    if (this.useInMemory) {
      return this.checkLimitInMemory(key, config);
    }

    return this.checkLimitRedis(key, config);
  }

  private checkLimitInMemory(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const record = this.inMemoryStore.get(key);

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      this.cleanupInMemory();
    }

    if (!record || now > record.resetAt) {
      // First request or window expired
      const resetAt = now + config.windowMs;
      this.inMemoryStore.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt,
      };
    }

    if (record.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetAt,
        retryAfter: Math.ceil((record.resetAt - now) / 1000),
      };
    }

    record.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - record.count,
      resetAt: record.resetAt,
    };
  }

  private async checkLimitRedis(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    try {
      // Use sliding window with sorted sets
      const multi = this.redis.multi();

      // Remove old entries outside the window
      multi.zremrangebyscore(key, 0, windowStart);

      // Add current request
      multi.zadd(key, now, `${now}-${Math.random()}`);

      // Count requests in window
      multi.zcard(key);

      // Set expiry
      multi.pexpire(key, config.windowMs);

      const results = await multi.exec();
      const count = results[2][1] as number;

      if (count > config.maxRequests) {
        // Get oldest entry to calculate retry time
        const oldest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
        const oldestTime = oldest.length >= 2 ? parseInt(oldest[1]) : now;
        const resetAt = oldestTime + config.windowMs;

        return {
          allowed: false,
          remaining: 0,
          resetAt,
          retryAfter: Math.ceil((resetAt - now) / 1000),
        };
      }

      return {
        allowed: true,
        remaining: config.maxRequests - count,
        resetAt: now + config.windowMs,
      };
    } catch (error) {
      console.error('[RateLimiter] Redis error, falling back to allow:', error);
      // On Redis error, allow the request but log it
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: now + config.windowMs,
      };
    }
  }

  private cleanupInMemory(): void {
    const now = Date.now();
    for (const [key, record] of this.inMemoryStore.entries()) {
      if (now > record.resetAt) {
        this.inMemoryStore.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(identifier: string, type: RateLimitType = 'api'): Promise<void> {
    const key = `ratelimit:${type}:${identifier}`;

    if (this.useInMemory) {
      this.inMemoryStore.delete(key);
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('[RateLimiter] Failed to reset:', error);
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(identifier: string, type: RateLimitType = 'api'): Promise<RateLimitResult> {
    const config = RATE_LIMITS[type];
    const key = `ratelimit:${type}:${identifier}`;

    if (this.useInMemory) {
      const record = this.inMemoryStore.get(key);
      if (!record || Date.now() > record.resetAt) {
        return {
          allowed: true,
          remaining: config.maxRequests,
          resetAt: Date.now() + config.windowMs,
        };
      }
      return {
        allowed: record.count < config.maxRequests,
        remaining: Math.max(0, config.maxRequests - record.count),
        resetAt: record.resetAt,
      };
    }

    try {
      const now = Date.now();
      const windowStart = now - config.windowMs;

      await this.redis.zremrangebyscore(key, 0, windowStart);
      const count = await this.redis.zcard(key);

      return {
        allowed: count < config.maxRequests,
        remaining: Math.max(0, config.maxRequests - count),
        resetAt: now + config.windowMs,
      };
    } catch (error) {
      console.error('[RateLimiter] Failed to get status:', error);
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetAt: Date.now() + config.windowMs,
      };
    }
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return !this.useInMemory && this.redis?.status === 'ready';
  }
}

// Export singleton instance
export const redisRateLimiter = new RedisRateLimiter();

// Export types
export type { RateLimitResult, RateLimitConfig, RateLimitType };
