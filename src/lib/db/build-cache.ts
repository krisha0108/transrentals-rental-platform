/**
 * Cached DB lookups for stable data (service IDs, location IDs).
 *
 * Service IDs use a module-level Map (finite, immutable in production — safe).
 * Location IDs use unstable_cache (unbounded slugs → module Map would leak memory).
 */

import { unstable_cache } from 'next/cache';
import { prisma } from './prisma';

// Finite, fixed-size Map for service IDs — these never change in production
const _serviceCache = new Map<string, string | null>();

async function getOrCacheService(key: string, fn: () => Promise<string | null>): Promise<string | null> {
  if (_serviceCache.has(key)) return _serviceCache.get(key) as string | null;
  // Don't cache a DB-error null — that would wrongly stick as "service doesn't
  // exist" for the life of the process after a transient outage. A genuinely
  // missing service (fn() resolves to null) is still cached below.
  try {
    const result = await fn();
    _serviceCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}

/** Returns the id of the luxury-car-rental service (cached). */
export function getLuxuryServiceId(): Promise<string | null> {
  return getOrCacheService('luxury-car-rental', async () => {
    const svc = await prisma.services.findFirst({
      where: { slug: 'luxury-car-rental', isActive: true },
      select: { id: true },
    });
    return svc?.id ?? null;
  });
}

/** Returns the id of the car-rental service (cached). */
export function getCarRentalServiceId(): Promise<string | null> {
  return getOrCacheService('car-rental', async () => {
    const svc = await prisma.services.findFirst({
      where: { slug: 'car-rental', isActive: true },
      select: { id: true },
    });
    return svc?.id ?? null;
  });
}

/** Returns the id of the self-drive car rental service (cached). */
export function getSelfDriveServiceId(): Promise<string | null> {
  return getOrCacheService('self-drive', async () => {
    const svc = await prisma.services.findFirst({
      where: { slug: { in: ['self-drive-car-rental', 'self-drive-car-rentals', 'self-drive'] }, isActive: true },
      select: { id: true },
    });
    return svc?.id ?? null;
  });
}

/** Returns the id of the transporter service (cached). */
export function getTransporterServiceId(): Promise<string | null> {
  return getOrCacheService('transporter', async () => {
    const svc = await prisma.services.findFirst({
      where: { slug: 'transporter', isActive: true },
      select: { id: true },
    });
    return svc?.id ?? null;
  });
}

/** Returns the id of the bus-rental service (cached). */
export function getBusRentalServiceId(): Promise<string | null> {
  return getOrCacheService('bus-rental', async () => {
    const svc = await prisma.services.findFirst({
      where: { slug: 'bus-rental', isActive: true },
      select: { id: true },
    });
    return svc?.id ?? null;
  });
}

/**
 * Returns the location row id for a given slug.
 * Uses unstable_cache (NOT a Map) — location slugs are unbounded and a
 * module-level Map would grow forever causing the memory leak devops flagged.
 * Cache TTL: 1 hour, tagged 'locations' for revalidation.
 */
const _getCachedLocationId = unstable_cache(
  async (slug: string): Promise<string | null> => {
    const loc = await prisma.locations.findFirst({
      where: { slug },
      select: { id: true },
    });
    return loc?.id ?? null;
  },
  ['location-id'],
  { revalidate: 3600, tags: ['locations'] }
);

export function getLocationId(slug: string): Promise<string | null> {
  return _getCachedLocationId(slug);
}
