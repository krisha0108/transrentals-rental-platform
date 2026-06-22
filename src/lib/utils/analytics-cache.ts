/**
 * Analytics cache with:
 *  1. Redis backend (survives redeploy) — falls back to in-memory if REDIS_URL unset
 *  2. Single-flight deduplication — concurrent callers share one Promise, no stampede
 *  3. 15-minute TTL — outlasts the realtime-poll interval gap
 */
import { cache as redisCache } from '@/lib/cache/redis-cache';

const TTL_SECONDS = 15 * 60; // 15 min

// One Promise per cache-key; shared by all concurrent callers
const inFlight = new Map<string, Promise<any>>();

export function buildCacheKey(route: string, params: Record<string, string>): string {
  const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  return `${route}:${sorted.map(([k, v]) => `${k}=${v}`).join('&')}`;
}

/**
 * Get or compute with single-flight + Redis.
 *
 * Flow:
 *   cache hit  → return immediately, no DB
 *   in-flight  → join the running Promise, still no extra DB query
 *   cold start → run compute(), cache result, let others share the Promise
 */
export async function getOrCompute<T>(
  key: string,
  compute: () => Promise<T>
): Promise<T> {
  // 1. Cache hit
  const cached = await redisCache.get<T>(key);
  if (cached !== null) return cached;

  // 2. Already computing — share the Promise
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  // 3. First caller — start computation
  const promise = compute()
    .then(async (result) => {
      await redisCache.set(key, result, TTL_SECONDS);
      return result;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

// Legacy sync helpers kept for any other routes that import them
const _legacyCache = new Map<string, { data: any; expiresAt: number }>();

export function getCached<T = any>(key: string): T | null {
  const entry = _legacyCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _legacyCache.delete(key); return null; }
  return entry.data as T;
}

export function setCached<T = any>(key: string, data: T, ttlMs = TTL_SECONDS * 1000): void {
  _legacyCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}
