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
