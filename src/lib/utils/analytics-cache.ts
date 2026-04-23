// Simple in-memory TTL cache for analytics routes
// Prevents repeated full-table scans on every admin dashboard poll

const cache = new Map<string, { data: any; expiresAt: number }>();

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached(key: string, data: any, ttlMs = TTL_MS): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function buildCacheKey(route: string, params: Record<string, string>): string {
  const sorted = Object.entries(params).sort(([a], [b]) => a.localeCompare(b));
  return `${route}:${sorted.map(([k, v]) => `${k}=${v}`).join('&')}`;
}
