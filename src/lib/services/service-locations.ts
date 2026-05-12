/**
 * Helper functions to generate static params from database for service location pages
 * This ensures all services use database locations instead of static files
 */

import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getParentServiceSlug } from '@/lib/constants/service-mapping';

const _cachedServiceLocations = unstable_cache(
  async (dbSlug: string) => {
    const service = await prisma.services.findUnique({
      where: { slug: dbSlug },
      include: {
        service_locations: {
          where: { isActive: true },
          include: {
            locations: { select: { slug: true, name: true } },
          },
        },
      },
    });
    if (!service) return null;
    return service.service_locations.map((sl) => ({ location: sl.locations.slug }));
  },
  ['service-locations-static'],
  { revalidate: 3600, tags: ['service-locations', 'services'] }
);

const _cachedAllActiveLocations = unstable_cache(
  async () => {
    const locations = await prisma.locations.findMany({
      where: { isActive: true },
      select: { slug: true, name: true },
    });
    return locations.map((loc) => ({ location: loc.slug }));
  },
  ['all-active-locations'],
  { revalidate: 3600, tags: ['locations'] }
);

/**
 * Get locations for a specific service from database
 * Used by generateStaticParams in service location pages
 */
export async function getServiceLocations(serviceSlug: string) {
  try {
    // Skip database calls during CI/CD build
    if (process.env.SKIP_DATABASE_CALLS === '1') {
      console.log(`[${serviceSlug}] Skipping database calls during build`);
      return [];
    }

    // SERVICE_PARENT_MAP parent slugs → actual DB service slugs
    const PARENT_SLUG_TO_DB: Record<string, string> = {
      'bike-rental': 'bike-on-rent',
      'self-drive-car-rental': 'self-drive-car-rentals',
      'car-rental-with-driver': 'car-rental',
      'truck-tempo-rental': 'transporter',
      'packers-movers': 'packers-and-movers',
    };
    // Sub-services (e.g. royal-enfield-on-rent) are stored under their parent slug in DB
    const parentSlug = getParentServiceSlug(serviceSlug);
    const dbSlug = PARENT_SLUG_TO_DB[parentSlug] || parentSlug;

    const locations = await _cachedServiceLocations(dbSlug);
    if (!locations) {
      console.log(`[${serviceSlug}] Service not found in database`);
      return [];
    }
    console.log(`[${serviceSlug}] Generating ${locations.length} location pages from database`);
    return locations;
  } catch (error) {
    console.error(`[${serviceSlug}] Error fetching locations:`, error);
    // Fallback to empty array if database error
    return [];
  }
}

/**
 * Get all active city/town locations — used by generateStaticParams for service pages
 * that should be pre-built for every city (not just service-enabled ones)
 */
export async function getAllCityLocations() {
  try {
    if (process.env.SKIP_DATABASE_CALLS === '1') return [];
    const locations = await prisma.locations.findMany({
      where: { type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] }, isActive: true },
      select: { slug: true },
    });
    return locations.map((loc) => ({ location: loc.slug }));
  } catch (error) {
    console.error('[locations] Error fetching city locations:', error);
    return [];
  }
}

/**
 * Get all active locations from database (for services without specific service mapping)
 * Useful for generic vehicle-specific pages that should be available wherever parent service is available
 */
export async function getAllActiveLocations() {
  try {
    // Skip database calls during CI/CD build
    if (process.env.SKIP_DATABASE_CALLS === '1') {
      console.log('[locations] Skipping database calls during build');
      return [];
    }

    const locations = await _cachedAllActiveLocations();
    console.log(`[locations] Found ${locations.length} active locations in database`);
    return locations;
  } catch (error) {
    console.error('[locations] Error fetching locations:', error);
    return [];
  }
}
