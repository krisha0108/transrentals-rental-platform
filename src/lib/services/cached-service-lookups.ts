/**
 * Cached service ID lookups — used by service location pages to avoid
 * direct uncached Prisma calls on every request (P2024 pool exhaustion fix).
 * All functions cache for 1 hour using Next.js unstable_cache.
 */
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db/prisma';

/**
 * Get a service record by slug (id + name + slug). Cached 1hr.
 * Use this instead of prisma.services.findUnique/findFirst in page bodies.
 */
export const getCachedServiceBySlug = unstable_cache(
  async (slug: string) => {
    return prisma.services.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
  },
  ['service-by-slug'],
  { revalidate: 3600, tags: ['services'] }
);

/**
 * Get the self-drive car rental service (tries multiple slug variants). Cached 1hr.
 */
export const getCachedSelfDriveService = unstable_cache(
  async () => {
    return prisma.services.findFirst({
      where: {
        slug: { in: ['self-drive-car-rental', 'self-drive-car-rentals', 'self-drive'] },
        isActive: true,
        parentId: null,
      },
      select: { id: true, name: true, slug: true },
    });
  },
  ['self-drive-service'],
  { revalidate: 3600, tags: ['services'] }
);

/**
 * Get all active sub-services (children) of a parent service. Cached 1hr.
 */
export const getCachedSubServices = unstable_cache(
  async (parentId: string) => {
    return prisma.services.findMany({
      where: { parentId, isActive: true },
      select: { id: true },
    });
  },
  ['sub-services-by-parent'],
  { revalidate: 3600, tags: ['services'] }
);

/**
 * Compute weighted-average AggregateRating for a service+location from vendor data.
 * Returns null if no vendor data — callers should fall back to static defaults.
 * Cached 1hr per service+location pair.
 */
export const getServiceLocationRating = unstable_cache(
  async (serviceSlug: string, locationSlug: string) => {
    try {
      const [service, location] = await Promise.all([
        prisma.services.findFirst({ where: { slug: serviceSlug }, select: { id: true } }),
        prisma.locations.findFirst({ where: { slug: locationSlug, isActive: true }, select: { id: true } }),
      ]);

      if (!service || !location) return null;

      const vendors = await prisma.vendors.findMany({
        where: {
          vendor_approved_services: { some: { serviceId: service.id } },
          vendor_approved_locations: { some: { locationId: location.id, isActive: true } },
          totalRatings: { gt: 0 },
        },
        select: { rating: true, totalRatings: true },
      });

      if (vendors.length === 0) return null;

      let weightedSum = 0;
      let totalReviews = 0;
      for (const v of vendors) {
        if (v.rating && v.totalRatings) {
          weightedSum += v.rating * v.totalRatings;
          totalReviews += v.totalRatings;
        }
      }

      if (totalReviews === 0) return null;

      return {
        ratingValue: Math.round((weightedSum / totalReviews) * 10) / 10,
        reviewCount: totalReviews,
      };
    } catch {
      return null;
    }
  },
  ['vendor-service-location-rating'],
  { revalidate: 3600, tags: ['vendors', 'services', 'locations'] }
);
