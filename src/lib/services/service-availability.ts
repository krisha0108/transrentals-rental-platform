import { prisma } from '@/lib/db/prisma';

/**
 * Check if a service is available in a specific location
 * @param serviceSlug - The slug of the service (e.g., 'car-rental', 'bike-rental')
 * @param locationSlug - The slug of the location (e.g., 'ahmedabad', 'mumbai')
 * @returns boolean - true if service is available, false otherwise
 */
export async function isServiceAvailableInLocation(
  serviceSlug: string,
  locationSlug: string
): Promise<boolean> {
  try {
    // Skip database calls during CI/CD build
    if (process.env.SKIP_DATABASE_CALLS === '1') {
      return true;
    }

    // During build time, prisma might be null - return true to render all pages
    if (!prisma) {
      console.log('Prisma client not available during build - returning true');
      return true;
    }

    const serviceLocation = await prisma.service_locations.findFirst({
      where: {
        services: { slug: serviceSlug },
        locations: { slug: locationSlug },
        isActive: true,
      },
    });

    return !!serviceLocation;
  } catch (error) {
    console.error('Error checking service availability:', error);
    // In case of error, return true to avoid blocking users
    return true;
  }
}

/**
 * Get service details with location availability
 */
export async function getServiceWithLocationStatus(
  serviceSlug: string,
  locationSlug: string
) {
  try {
    // Skip database calls during CI/CD build
    if (process.env.SKIP_DATABASE_CALLS === '1') {
      return null;
    }

    if (!prisma) {
      return null;
    }

    const service = await prisma.services.findUnique({
      where: { slug: serviceSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        service_locations: {
          where: {
            locations: { slug: locationSlug },
            isActive: true,
          },
          include: {
            locations: true,
          },
        },
      },
    });

    if (!service) {
      return null;
    }

    return {
      ...service,
      isAvailableInLocation: service.service_locations.length > 0,
    };
  } catch (error) {
    console.error('Error fetching service with location status:', error);
    return null;
  }
}

/**
 * Get all available locations for a service
 */
export async function getAvailableLocationsForService(serviceSlug: string) {
  try {
    // Skip database calls during CI/CD build
    if (process.env.SKIP_DATABASE_CALLS === '1') {
      return [];
    }

    if (!prisma) {
      return [];
    }

    const service = await prisma.services.findUnique({
      where: { slug: serviceSlug },
      include: {
        service_locations: {
          where: { isActive: true },
          include: {
            locations: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      return [];
    }

    return service.service_locations.map((sl) => sl.locations);
  } catch (error) {
    console.error('Error fetching available locations:', error);
    return [];
  }
}

/**
 * Get nearby available locations for a service
 */
export async function getNearbyAvailableLocations(
  serviceSlug: string,
  currentLocationSlug: string,
  limit: number = 6
) {
  try {
    // Skip database calls during CI/CD build
    if (process.env.SKIP_DATABASE_CALLS === '1') {
      return [];
    }

    const availableLocations = await getAvailableLocationsForService(serviceSlug);

    // Filter out current location and limit results
    return availableLocations
      .filter((loc) => loc.slug !== currentLocationSlug)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching nearby locations:', error);
    return [];
  }
}
