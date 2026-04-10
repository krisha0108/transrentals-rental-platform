/**
 * Helper functions to generate static params from database for service location pages
 * This ensures all services use database locations instead of static files
 */

import { prisma } from '@/lib/db/prisma';
import { getParentServiceSlug } from '@/lib/constants/service-mapping';

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

    // Fetch enabled locations from database
    const service = await prisma.services.findUnique({
      where: { slug: dbSlug },
      include: {
        service_locations: {
          where: { isActive: true },
          include: {
            locations: {
              select: { slug: true, name: true }
            }
          }
        }
      }
    });

    if (!service) {
      console.log(`[${serviceSlug}] Service not found in database`);
      return [];
    }

    const locations = service.service_locations.map((sl) => ({
      location: sl.locations.slug,
    }));

    console.log(`[${serviceSlug}] Generating ${locations.length} location pages from database`);
    return locations;
  } catch (error) {
    console.error(`[${serviceSlug}] Error fetching locations:`, error);
    // Fallback to empty array if database error
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

    // Get all active locations
    const locations = await prisma.locations.findMany({
      where: { isActive: true },
      select: { slug: true, name: true }
    });

    console.log(`[locations] Found ${locations.length} active locations in database`);
    return locations.map((loc) => ({
      location: loc.slug,
    }));
  } catch (error) {
    console.error('[locations] Error fetching locations:', error);
    return [];
  }
}
