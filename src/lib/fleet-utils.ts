import { prisma } from '@/lib/db/prisma';

/**
 * Safely parse JSON field from Prisma (handles string | null | object)
 */
function parseJsonField<T>(value: unknown, defaultValue: T): T {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return defaultValue;
    }
  }
  return value as T;
}

export interface FleetVehicle {
  id: string;
  name: string;
  slug: string;
  brand: string;
  image: string;
  price: number;
  rating: number;
  features: string[];
  specs: Record<string, string>;
  vehicleType: string;
  availabilityType: string;
}

/**
 * Fetch fleet vehicles by category for a specific location
 * Works with both ALL_INDIA and SPECIFIC_LOCATIONS availability types
 */
export async function getFleetByCategory(
  categorySlug: string,
  locationSlug?: string
): Promise<FleetVehicle[]> {
  try {
    // Find the category
    const category = await prisma.fleet_categories.findFirst({
      where: {
        OR: [
          { slug: categorySlug },
          { slug: `${categorySlug}-rental` },
          { name: { contains: categorySlug } },
        ],
      },
    });

    if (!category) {
      console.log(`Category not found: ${categorySlug}`);
      return [];
    }

    // Fetch vehicles for this category
    const vehicles = await prisma.fleet.findMany({
      where: {
        isActive: true,
        categoryId: category.id,
      },
      include: {
        fleet_categories: true,
        fleet_location_rates: locationSlug
          ? {
              where: {
                fleet_locations: { slug: locationSlug },
                isActive: true,
              },
              include: { fleet_locations: true },
            }
          : false,
        fleet_availability: locationSlug
          ? {
              where: {
                fleet_locations: { slug: locationSlug },
              },
              include: { fleet_locations: true },
            }
          : false,
      },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });

    // Transform and filter vehicles
    return vehicles
      .filter((vehicle) => {
        // For SPECIFIC_LOCATIONS type, check if available in this location
        if (vehicle.fleet_availabilityType === 'SPECIFIC_LOCATIONS' && locationSlug) {
          const locationAvailability = vehicle.fleet_availability?.[0];
          return locationAvailability?.isAvailable;
        }
        // ALL_INDIA vehicles are always available everywhere
        return true;
      })
      .map((vehicle) => {
        const locationRate = vehicle.fleet_location_rates?.[0];
        return {
          id: vehicle.id,
          name: vehicle.name,
          slug: vehicle.slug,
          brand: vehicle.brand || '',
          image: vehicle.primaryImage || '/images/fleet/honda-city.jpg',
          price: locationRate?.dailyRate || vehicle.basePrice,
          rating: 4.7, // Default rating
          features: parseJsonField<string[]>(vehicle.features, []),
          specs: parseJsonField<Record<string, string>>(vehicle.specs, {}),
          vehicleType: vehicle.vehicleType || '',
          availabilityType: vehicle.fleet_availabilityType,
        };
      });
  } catch (error) {
    console.error(`Error fetching fleet for category ${categorySlug}:`, error);
    return [];
  }
}

/**
 * Fetch fleet vehicles by category name variations
 * Searches all matching categories and combines results
 */
export async function getFleetByCategoryNames(
  categoryNames: string[],
  locationSlug?: string
): Promise<FleetVehicle[]> {
  try {
    // Find ALL categories matching any of the names
    const categories = await prisma.fleet_categories.findMany({
      where: {
        OR: categoryNames.flatMap((name) => [
          { slug: name.toLowerCase() },
          { slug: name.toLowerCase().replace(/\s+/g, '-') },
          { name: { contains: name } },
        ]),
      },
    });

    if (categories.length === 0) {
      console.log(`No categories found for names: ${categoryNames.join(', ')}`);
      return [];
    }

    // Fetch vehicles from all matching categories
    const allVehicles: FleetVehicle[] = [];
    for (const category of categories) {
      const vehicles = await getFleetByCategory(category.slug, locationSlug);
      allVehicles.push(...vehicles);
    }

    // Remove duplicates by id
    const uniqueVehicles = allVehicles.filter(
      (vehicle, index, self) => index === self.findIndex((v) => v.id === vehicle.id)
    );

    return uniqueVehicles;
  } catch (error) {
    console.error('Error fetching fleet by category names:', error);
    return [];
  }
}

/**
 * Fetch ALL active fleet vehicles (for ALL_INDIA type)
 * Useful for services like tempo traveller where vehicles are available everywhere
 */
export async function getAllIndiaFleet(
  categoryNames?: string[]
): Promise<FleetVehicle[]> {
  try {
    const whereClause: any = {
      isActive: true,
      availabilityType: 'ALL_INDIA',
    };

    // If category names provided, filter by them
    if (categoryNames && categoryNames.length > 0) {
      const categories = await prisma.fleet_categories.findMany({
        where: {
          OR: categoryNames.flatMap((name) => [
            { slug: name.toLowerCase() },
            { slug: name.toLowerCase().replace(/\s+/g, '-') },
            { name: { contains: name } },
          ]),
        },
      });

      if (categories.length > 0) {
        whereClause.categoryId = { in: categories.map((c) => c.id) };
      }
    }

    const vehicles = await prisma.fleet.findMany({
      where: whereClause,
      include: {
        fleet_categories: true,
      },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });

    return vehicles.map((vehicle) => ({
      id: vehicle.id,
      name: vehicle.name,
      slug: vehicle.slug,
      brand: vehicle.brand || '',
      image: vehicle.primaryImage || '/images/vehicles/default-vehicle.jpg',
      price: vehicle.basePrice,
      rating: 4.7,
      features: parseJsonField<string[]>(vehicle.features, []),
      specs: parseJsonField<Record<string, string>>(vehicle.specs, {}),
      vehicleType: vehicle.vehicleType || '',
      availabilityType: vehicle.fleet_availabilityType,
    }));
  } catch (error) {
    console.error('Error fetching ALL_INDIA fleet:', error);
    return [];
  }
}
