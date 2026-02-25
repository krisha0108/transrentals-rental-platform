import { Metadata } from 'next';
import { FleetPageClient } from './FleetPageClient';
import { prisma } from '@/lib/db/prisma';

export const metadata: Metadata = {
  title: 'Our Fleet - Bikes, Cars, Buses, Trucks & More | TransRentals',
  description: 'Browse our complete fleet of vehicles available for rent across India. Bikes, cars, buses, tempo travellers, trucks, and 100+ more vehicles.',
  keywords: ['vehicle fleet', 'rental vehicles', 'bikes for rent', 'cars for rent', 'tempo traveller', 'truck rental'],
};

// Force dynamic rendering - ensures new vehicles appear immediately
export const dynamic = 'force-dynamic';
// Revalidate every 60 seconds as fallback
export const revalidate = 60;

// Fetch initial data on server
async function getFleetData() {
  try {
    // First fetch all services to use for categorization
    const allServices = await prisma.services.findMany({
      where: { isActive: true, parentId: null },
      select: { id: true, name: true, slug: true },
    });

    const [categories, locations, legacyVehicles, adminVehicles] = await Promise.all([
      // Legacy fleet categories
      prisma.fleet_categories.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
      // Locations from Location table (replacing legacy FleetLocation)
      prisma.locations.findMany({
        where: { type: 'CITY', isActive: true },
        include: {
          parent: { select: { name: true, code: true } },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        take: 100, // Limit for performance
      }),
      // Legacy fleet vehicles
      prisma.fleet.findMany({
        where: { isActive: true },
        include: {
          fleet_categories: true,
        },
        orderBy: [{ priority: 'desc' }, { name: 'asc' }],
      }),
      // Admin-added vehicles (VehicleModel) - fetch ALL active vehicles
      prisma.vehicle_models.findMany({
        where: {
          isActive: true,
          brands: {
            isActive: true,
          },
        },
        include: {
          brands: { select: { id: true, name: true, slug: true } },
          services_vehicle_models_serviceIdToservices: { select: { id: true, name: true, slug: true } },
          services_vehicle_models_subServiceIdToservices: { select: { id: true, name: true, slug: true } },
          vehicle_model_locations: {
            where: { isActive: true },
            include: {
              locations: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      }),
    ]);

    // Transform legacy vehicles
    const legacyVehiclesList = legacyVehicles.map(v => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      brand: v.brand,
      category: {
        id: v.fleet_categories.id,
        name: v.fleet_categories.name,
        slug: v.fleet_categories.slug,
      },
      vehicleType: v.vehicleType,
      price: v.basePrice,
      basePrice: v.basePrice,
      shortDesc: v.shortDesc ?? undefined,
      specs: v.specs,
      features: v.features,
      primaryImage: v.primaryImage ?? undefined,
      availabilityType: v.availabilityType as 'ALL_INDIA' | 'SPECIFIC_LOCATIONS',
      isFeatured: v.isFeatured,
      source: 'legacy' as const,
    }));

    // Transform admin vehicles
    const adminVehiclesList = adminVehicles.map(v => {
      const locationPrice = v.vehicle_model_locations?.[0]?.basePricePerDay;
      const price = locationPrice || (v as any).basePricePerDay || 0;

      // Get location names for display
      const locationNames = v.vehicle_model_locations?.map(l => l.locations?.name).filter(Boolean) || [];
      const service = v.services_vehicle_models_serviceIdToservices;
      const subService = v.services_vehicle_models_subServiceIdToservices;

      return {
        id: `admin-${v.id}`,
        name: v.name,
        slug: v.slug,
        brand: v.brands?.name || 'Unknown',
        category: {
          id: service?.id || '',
          name: service?.name || 'Uncategorized',
          slug: service?.slug || '',
        },
        subCategory: subService ? {
          id: subService.id,
          name: subService.name,
          slug: subService.slug,
        } : undefined,
        vehicleType: subService?.name || service?.name || 'Vehicle',
        price: price,
        basePrice: price,
        shortDesc: v.mileage ? `${v.mileage} mileage` : (v.fuelType ? `${v.fuelType}` : undefined),
        specs: v.specs,
        features: v.features,
        primaryImage: v.sideImage ?? undefined,
        availabilityType: 'ALL_INDIA' as const,
        isFeatured: false,
        source: 'admin' as const,
        transmission: v.transmission,
        fuelType: v.fuelType,
        seatingCapacity: v.seatingCapacity,
        locationCount: v.vehicle_model_locations?.length || 0,
        locations: locationNames,
      };
    });

    // Combine vehicles (admin vehicles first, then legacy)
    const allVehicles = [...adminVehiclesList, ...legacyVehiclesList];

    // Create categories from both legacy categories and services
    const legacyCategories = categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? undefined,
      icon: c.icon ?? undefined,
    }));

    // Add services as categories if not already present
    const serviceCategories = allServices
      .filter(s => !legacyCategories.some(c => c.slug === s.slug))
      .map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: undefined,
        icon: undefined,
      }));

    const allCategories = [...legacyCategories, ...serviceCategories];

    // Transform locations from Location table
    const transformedLocations = locations.map(l => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      state: l.parent?.name || '',
      tier: 1, // Default tier
    }));

    return {
      categories: allCategories,
      locations: transformedLocations,
      vehicles: allVehicles,
    };
  } catch (error) {
    console.error('Failed to fetch fleet data:', error);
    return { categories: [], locations: [], vehicles: [] };
  }
}

export default async function FleetPage() {
  const { categories, locations, vehicles } = await getFleetData();

  // Group vehicles by category dynamically
  const vehiclesByCategory: Record<string, typeof vehicles> = {};

  categories.forEach(category => {
    vehiclesByCategory[category.id] = vehicles.filter(v => v.category.id === category.id);
  });

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white py-16 md:py-24">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Vehicle Fleet</h1>
          <p className="text-xl opacity-90">Browse {vehicles.length}+ vehicles available across India</p>
        </div>
      </section>

      {/* Client-side interactive fleet display */}
      <FleetPageClient
        categories={categories}
        locations={locations}
        vehiclesByCategory={vehiclesByCategory}
      />
    </>
  );
}
