import { prisma } from '@/lib/db/prisma';
import { getCityBySlug, getStateBySlug, IndianState } from '@/data/indian-cities';

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

    if (serviceLocation) return true;

    // If service doesn't exist in DB at all, it's a static SEO page — always available
    const serviceExists = await prisma.services.findUnique({
      where: { slug: serviceSlug },
      select: { id: true },
    });

    return !serviceExists; // true = static service (not in DB), false = managed service with no active location
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
 * Combined check: validates city exists AND service is active in location.
 * Returns the redirect path (service homepage) if invalid, or null if page should render.
 * Use this in every [location] page component.
 */
export async function validateCityAndServiceOrRedirect(
  serviceSlug: string,
  locationSlug: string
): Promise<string | null> {
  // Step 1: Is this a known city?
  const city = getCityBySlug(locationSlug);
  if (!city) return `/${serviceSlug}`;

  // Step 2: Is the service active in this location?
  const isAvailable = await isServiceAvailableInLocation(serviceSlug, locationSlug);
  if (!isAvailable) return `/${serviceSlug}`;

  return null; // All good - render the page
}

export type ServicePageContext =
  | { type: 'city'; city: NonNullable<ReturnType<typeof getCityBySlug>> }
  | { type: 'coming-soon'; city: NonNullable<ReturnType<typeof getCityBySlug>> }
  | { type: 'state'; state: IndianState; activeCities: Array<{ name: string; slug: string; tier?: number }> }
  | { type: 'redirect'; to: string };

/**
 * Get all active locations in a state for a given service
 */
export async function getActiveLocationsInStateForService(
  serviceSlug: string,
  stateCode: string
): Promise<Array<{ name: string; slug: string; tier?: number }>> {
  if (process.env.SKIP_DATABASE_CALLS === '1') return [];
  if (!prisma) return [];

  try {
    const serviceLocations = await getAvailableLocationsForService(serviceSlug);
    return serviceLocations
      .filter(loc => {
        const cityData = getCityBySlug(loc.slug);
        return cityData?.stateCode === stateCode;
      })
      .map(loc => {
        const cityData = getCityBySlug(loc.slug);
        return { name: loc.name, slug: loc.slug, tier: cityData?.tier };
      })
      .sort((a, b) => (a.tier ?? 99) - (b.tier ?? 99));
  } catch (error) {
    console.error('Error fetching locations for state:', error);
    return [];
  }
}

/**
 * Resolves a [location] slug to city page, state hub page, or redirect.
 * Use this instead of validateCityAndServiceOrRedirect in page components.
 *
 * @param options.comingSoonIfUnavailable - If true, returns 'coming-soon' instead of 'redirect'
 *   when city is known but service is not yet active there.
 */
export async function resolveServicePage(
  serviceSlug: string,
  locationSlug: string,
  options?: { comingSoonIfUnavailable?: boolean }
): Promise<ServicePageContext> {
  // Step 1: Is it a known city in static data?
  let city = getCityBySlug(locationSlug);

  // Step 1b: Not in static data — check DB locations table (cities added later)
  if (!city && prisma && process.env.SKIP_DATABASE_CALLS !== '1') {
    try {
      const dbLoc = await prisma.locations.findFirst({
        where: { slug: locationSlug, type: { in: ['CITY', 'UNION_TERRITORY'] }, isActive: true },
        select: { name: true, slug: true, code: true },
      });
      if (dbLoc) {
        city = {
          name: dbLoc.name,
          slug: dbLoc.slug,
          state: '',
          stateCode: dbLoc.code || '',
          tier: 3,
          keywords: [],
          priority: 5,
        };
      }
    } catch {
      // ignore - will fall through to state/redirect
    }
  }

  if (city) {
    const isAvailable = await isServiceAvailableInLocation(serviceSlug, locationSlug);
    if (!isAvailable) {
      if (options?.comingSoonIfUnavailable) return { type: 'coming-soon', city };
      return { type: 'redirect', to: `/${serviceSlug}` };
    }
    return { type: 'city', city };
  }

  // Step 2: Is it a known state?
  const state = getStateBySlug(locationSlug);
  if (state) {
    const activeCities = await getActiveLocationsInStateForService(serviceSlug, state.code);
    if (activeCities.length === 0) {
      if (options?.comingSoonIfUnavailable) {
        // Treat the state/UT as a "city" for the coming-soon page display
        const stateAsCity = {
          name: state.name,
          slug: state.slug,
          state: state.name,
          stateCode: state.code,
          tier: 3 as const,
          keywords: [],
          priority: 5,
        };
        return { type: 'coming-soon', city: stateAsCity };
      }
      return { type: 'redirect', to: `/${serviceSlug}` };
    }
    return { type: 'state', state, activeCities };
  }

  // Step 3: Neither — redirect
  return { type: 'redirect', to: `/${serviceSlug}` };
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
