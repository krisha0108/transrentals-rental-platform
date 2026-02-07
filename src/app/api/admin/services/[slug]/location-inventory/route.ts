import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Detect if service is chauffeur-based (only regular car rental with driver)
function isChauffeurService(slug: string): boolean {
  // Only regular car-rental (with driver) uses packages/routes
  // Luxury car rental uses fleet/models like other services
  return slug === 'car-rental' || slug === 'car-on-rent';
}

// GET - Get location-wise inventory for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { slug: serviceSlug } = resolvedParams;

    // Find the service
    const service = await prisma.services.findUnique({
      where: { slug: serviceSlug },
      select: { id: true, name: true, flowType: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Route to appropriate handler based on service type
    if (isChauffeurService(serviceSlug)) {
      return getChauffeurInventory(service.id, serviceSlug);
    } else {
      return getFleetInventory(service.id, serviceSlug);
    }
  } catch (error: any) {
    console.error('Location inventory error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location inventory', details: error?.message },
      { status: 500 }
    );
  }
}

// Handler for chauffeur services (car rental with packages/routes)
async function getChauffeurInventory(serviceId: string, serviceSlug: string) {
  try {

    // Get all vehicle categories for this service
    const vehicleCategories = await prisma.chauffeur_vehicle_categories.findMany({
      where: {
        serviceId: serviceId,
        isActive: true,
      },
      select: { id: true, name: true, slug: true },
    });

    // Get all locations
    const allLocations = await prisma.locations.findMany({
      where: {
        type: 'CITY',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        locations: {
          select: { name: true },
        },
      },
    });

    // Get local packages
    const localPackages = await prisma.chauffeur_local_packages.findMany({
      where: { isActive: true },
      include: {
        chauffeur_vehicle_categories: {
          select: { id: true, name: true },
        },
        locations: {
          select: { id: true, name: true },
        },
      },
    });

    // Get city pricing
    const cityPricing = await prisma.chauffeur_city_pricing.findMany({
      where: { isActive: true },
      include: {
        chauffeur_vehicle_categories: {
          select: { id: true, name: true },
        },
        locations: {
          select: { id: true, name: true },
        },
      },
    });

    // Get route packages (from and to)
    const routePackages = await prisma.chauffeur_route_packages.findMany({
      where: { isActive: true },
      include: {
        chauffeur_vehicle_categories: {
          select: { id: true, name: true },
        },
        locations_chauffeur_route_packages_fromLocationIdTolocations: {
          select: { id: true, name: true },
        },
        locations_chauffeur_route_packages_toLocationIdTolocations: {
          select: { id: true, name: true },
        },
      },
    });

    // Build inventory map
    const inventoryMap = new Map<string, {
      locationId: string;
      locationName: string;
      locationSlug: string;
      stateName: string;
      localPackages: any[];
      cityPricing: any[];
      routesFrom: any[];
      routesTo: any[];
      totalLocalPackages: number;
      totalCityPricing: number;
      totalRoutesFrom: number;
      totalRoutesTo: number;
    }>();

    // Initialize with all locations
    allLocations.forEach(loc => {
      inventoryMap.set(loc.id, {
        locationId: loc.id,
        locationName: loc.name,
        locationSlug: loc.slug,
        stateName: loc.locations?.name || 'Unknown',
        localPackages: [],
        cityPricing: [],
        routesFrom: [],
        routesTo: [],
        totalLocalPackages: 0,
        totalCityPricing: 0,
        totalRoutesFrom: 0,
        totalRoutesTo: 0,
      });
    });

    // Add local packages
    localPackages.forEach(pkg => {
      const location = inventoryMap.get(pkg.locationId);
      if (location) {
        location.localPackages.push({
          id: pkg.id,
          name: pkg.name,
          hours: pkg.hours,
          kms: pkg.kms,
          basePrice: pkg.basePrice,
          category: pkg.chauffeur_vehicle_categories?.name || 'Unknown',
        });
      }
    });

    // Add city pricing
    cityPricing.forEach(pricing => {
      const location = inventoryMap.get(pricing.locationId);
      if (location) {
        location.cityPricing.push({
          id: pricing.id,
          category: pricing.chauffeur_vehicle_categories?.name || 'Unknown',
          baseKmRate: pricing.baseKmRate,
          minKmPerDay: pricing.minKmPerDay,
        });
      }
    });

    // Add route packages
    routePackages.forEach(route => {
      // Add to "from" location
      const fromLocation = inventoryMap.get(route.fromLocationId);
      if (fromLocation) {
        fromLocation.routesFrom.push({
          id: route.id,
          to: route.locations_chauffeur_route_packages_toLocationIdTolocations?.name || 'Unknown',
          category: route.chauffeur_vehicle_categories?.name || 'Unknown',
          basePrice: route.basePrice,
          estimatedKm: route.estimatedKm,
        });
      }

      // Add to "to" location
      const toLocation = inventoryMap.get(route.toLocationId);
      if (toLocation) {
        toLocation.routesTo.push({
          id: route.id,
          from: route.locations_chauffeur_route_packages_fromLocationIdTolocations?.name || 'Unknown',
          category: route.chauffeur_vehicle_categories?.name || 'Unknown',
          basePrice: route.basePrice,
          estimatedKm: route.estimatedKm,
        });
      }
    });

    // Calculate totals and filter out empty locations
    const inventory = Array.from(inventoryMap.values())
      .map(item => ({
        ...item,
        totalLocalPackages: item.localPackages.length,
        totalCityPricing: item.cityPricing.length,
        totalRoutesFrom: item.routesFrom.length,
        totalRoutesTo: item.routesTo.length,
      }))
      .filter(item =>
        item.totalLocalPackages > 0 ||
        item.totalCityPricing > 0 ||
        item.totalRoutesFrom > 0 ||
        item.totalRoutesTo > 0
      );

    return NextResponse.json({
      success: true,
      serviceType: 'chauffeur',
      inventory,
      summary: {
        totalLocations: inventory.length,
        totalLocalPackages: inventory.reduce((sum, item) => sum + item.totalLocalPackages, 0),
        totalCityPricing: inventory.reduce((sum, item) => sum + item.totalCityPricing, 0),
        totalRoutes: inventory.reduce((sum, item) => sum + item.totalRoutesFrom, 0),
      },
      vehicleCategories,
    });
  } catch (error: any) {
    console.error('Chauffeur inventory error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chauffeur inventory', details: error?.message },
      { status: 500 }
    );
  }
}

// Handler for fleet-based services (bike, bus, truck, etc.)
async function getFleetInventory(serviceId: string, serviceSlug: string) {
  try {
    // Get all locations configured for this service
    const serviceLocations = await prisma.service_locations.findMany({
      where: {
        serviceId: serviceId,
        isActive: true,
      },
      include: {
        locations: {
          select: {
            id: true,
            name: true,
            slug: true,
            locations: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        locations: {
          name: 'asc',
        },
      },
    });

    const locationIds = serviceLocations.map(sl => sl.locationId);

    // Get vehicle models for each location
    const vehicleModelLocations = await prisma.vehicle_model_locations.findMany({
      where: {
        locationId: { in: locationIds },
        isActive: true,
        vehicle_models: {
          serviceId: serviceId,
          isActive: true,
        },
      },
      include: {
        vehicle_models: {
          select: {
            id: true,
            name: true,
            slug: true,
            brands: {
              select: {
                name: true,
              },
            },
            services_vehicle_models_subServiceIdToservices: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Get fleet vehicles for each location (filter by service)
    const fleetLocations = await prisma.vendor_fleet_locations.findMany({
      where: {
        locationId: { in: locationIds },
        isActive: true,
        vendor_fleets: {
          vehicle_models: {
            serviceId: serviceId,
            isActive: true,
          },
        },
      },
      include: {
        vendor_fleets: {
          select: {
            id: true,
            registrationNumber: true,
            vehicle_models: {
              select: {
                name: true,
              },
            },
            vendors: {
              select: {
                businessName: true,
              },
            },
          },
        },
      },
    });

    // Build inventory map
    const inventoryMap = new Map<string, {
      locationId: string;
      locationName: string;
      locationSlug: string;
      stateName: string;
      vehicleModels: any[];
      fleetVehicles: any[];
    }>();

    // Initialize with all service locations
    serviceLocations.forEach(sl => {
      if (sl.locations) {
        inventoryMap.set(sl.locationId, {
          locationId: sl.locationId,
          locationName: sl.locations.name,
          locationSlug: sl.locations.slug,
          stateName: sl.locations.locations?.name || 'Unknown',
          vehicleModels: [],
          fleetVehicles: [],
        });
      }
    });

    // Add vehicle models to inventory
    vehicleModelLocations.forEach(vml => {
      const location = inventoryMap.get(vml.locationId);
      if (location && vml.vehicle_models) {
        location.vehicleModels.push({
          id: vml.vehicle_models.id,
          name: vml.vehicle_models.name,
          brand: vml.vehicle_models.brands?.name || 'Unknown',
          category: vml.vehicle_models.services_vehicle_models_subServiceIdToservices?.name || 'Uncategorized',
          basePrice: vml.basePricePerDay || 0,
        });
      }
    });

    // Add fleet vehicles to inventory
    fleetLocations.forEach(fl => {
      const location = inventoryMap.get(fl.locationId);
      if (location && fl.vendor_fleets) {
        location.fleetVehicles.push({
          id: fl.vendor_fleets.id,
          modelName: fl.vendor_fleets.vehicle_models?.name || 'Unknown Model',
          registrationNumber: fl.vendor_fleets.registrationNumber || 'N/A',
          vendorName: fl.vendor_fleets.vendors?.businessName || 'Unknown Vendor',
        });
      }
    });

    // Convert map to array and add totals
    const inventory = Array.from(inventoryMap.values()).map(item => ({
      ...item,
      totalModels: item.vehicleModels.length,
      totalFleet: item.fleetVehicles.length,
    }));

    return NextResponse.json({
      success: true,
      serviceType: 'fleet',
      inventory,
      summary: {
        totalLocations: inventory.length,
        totalModels: inventory.reduce((sum, item) => sum + item.totalModels, 0),
        totalFleet: inventory.reduce((sum, item) => sum + item.totalFleet, 0),
      },
    });
  } catch (error: any) {
    console.error('Fleet inventory error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fleet inventory', details: error?.message },
      { status: 500 }
    );
  }
}
