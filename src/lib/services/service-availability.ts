import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { getCityBySlug, getStateBySlug, IndianState } from '@/data/indian-cities';

// Cached DB check: is service active in this location? (1 hour cache per service+location)
const _cachedIsServiceAvailable = unstable_cache(
  async (serviceSlug: string, locationSlug: string): Promise<boolean> => {
    const serviceLocation = await prisma.service_locations.findFirst({
      where: {
        services: { slug: serviceSlug },
        locations: { slug: locationSlug },
        isActive: true,
      },
    });
    if (serviceLocation) return true;
    const serviceExists = await prisma.services.findUnique({
      where: { slug: serviceSlug },
      select: { id: true },
    });
    return !serviceExists;
  },
  ['service-availability'],
  { revalidate: 3600, tags: ['service-locations', 'services'] }
);

// Cached DB fetch: all active locations for a service (1 hour cache per service)
const _cachedAvailableLocations = unstable_cache(
  async (serviceSlug: string) => {
    const service = await prisma.services.findUnique({
      where: { slug: serviceSlug },
      include: {
        service_locations: {
          where: { isActive: true },
          include: {
            locations: {
              select: { id: true, name: true, slug: true, type: true },
            },
          },
        },
      },
    });
    if (!service) return [];
    return service.service_locations.map((sl) => sl.locations);
  },
  ['service-available-locations'],
  { revalidate: 3600, tags: ['service-locations', 'services'] }
);

// Cached DB lookup: city by slug from DB (for cities not in static data)
const _cachedDbCityLookup = unstable_cache(
  async (locationSlug: string) => {
    return prisma.locations.findFirst({
      where: { slug: locationSlug, type: { in: ['CITY', 'UNION_TERRITORY'] }, isActive: true },
      select: { name: true, slug: true, code: true },
    });
  },
  ['db-city-lookup'],
  { revalidate: 3600, tags: ['locations'] }
);

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
    if (process.env.SKIP_DATABASE_CALLS === '1') return true;
    if (!prisma) return true;
    return await _cachedIsServiceAvailable(serviceSlug, locationSlug);
  } catch (error) {
    console.error('Error checking service availability:', error);
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
    if (process.env.SKIP_DATABASE_CALLS === '1') return [];
    if (!prisma) return [];
    return await _cachedAvailableLocations(serviceSlug);
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
      const dbLoc = await _cachedDbCityLookup(locationSlug);
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
