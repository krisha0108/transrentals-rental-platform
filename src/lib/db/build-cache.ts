/**
 * Module-level in-memory cache for stable DB lookups during build.
 *
 * During `next build`, thousands of pages render in the same worker process.
 * Service IDs (luxury-car-rental, self-drive-car-rentals, etc.) never change —
 * caching them here means each worker only hits the DB once instead of once
 * per page, dramatically reducing connection pool pressure.
 *
 * At runtime (ISR / server rendering) the cache is also valid because service
 * slugs/IDs are immutable in production.
 */

import { prisma } from './prisma';

// Internal cache store
const _cache = new Map<string, unknown>();

async function getOrCache<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (_cache.has(key)) return _cache.get(key) as T;
  const result = await fn();
  _cache.set(key, result);
  return result;
}

/** Returns the id of the luxury-car-rental service (cached). */
export function getLuxuryServiceId(): Promise<string | null> {
  return getOrCache('luxury-service-id', async () => {
    const svc = await prisma.services.findFirst({
      where: { slug: 'luxury-car-rental', isActive: true },
      select: { id: true },
    });
    return svc?.id ?? null;
  });
}

/** Returns the id of the car-rental service (cached). */
export function getCarRentalServiceId(): Promise<string | null> {
  return getOrCache('car-rental-service-id', async () => {
    const svc = await prisma.services.findFirst({
      where: { slug: 'car-rental', isActive: true },
      select: { id: true },
    });
    return svc?.id ?? null;
  });
}

/** Returns the id of the self-drive car rental service (cached). */
export function getSelfDriveServiceId(): Promise<string | null> {
  return getOrCache('self-drive-service-id', async () => {
    const svc = await prisma.services.findFirst({
      where: { slug: { in: ['self-drive-car-rental', 'self-drive-car-rentals', 'self-drive'] }, isActive: true },
      select: { id: true },
    });
    return svc?.id ?? null;
  });
}

/** Returns the id of the transporter service (cached). */
export function getTransporterServiceId(): Promise<string | null> {
  return getOrCache('transporter-service-id', async () => {
    const svc = await prisma.services.findFirst({
      where: { slug: 'transporter', isActive: true },
      select: { id: true },
    });
    return svc?.id ?? null;
  });
}

/** Returns the id of the bus-rental service (cached). */
export function getBusRentalServiceId(): Promise<string | null> {
  return getOrCache('bus-rental-service-id', async () => {
    const svc = await prisma.services.findFirst({
      where: { slug: 'bus-rental', isActive: true },
      select: { id: true },
    });
    return svc?.id ?? null;
  });
}

/** Returns the location row id for a given slug (cached per slug). */
export function getLocationId(slug: string): Promise<string | null> {
  return getOrCache(`location-id:${slug}`, async () => {
    const loc = await prisma.locations.findFirst({
      where: { slug },
      select: { id: true },
    });
    return loc?.id ?? null;
  });
}
