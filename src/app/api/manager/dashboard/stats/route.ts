import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// Helper function to get date ranges based on filter
function getDateRange(filter: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  switch (filter) {
    case 'today':
      return { gte: today };
    case 'yesterday':
      return { gte: yesterday, lt: today };
    case 'thisMonth':
      return { gte: thisMonthStart };
    case 'lastMonth':
      return { gte: lastMonthStart, lte: lastMonthEnd };
    case 'all':
    default:
      return {};
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    // Get current user and verify they are a manager
    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: {
        manager_locations: {
          include: { locations: true },
        },
        manager_services: {
          include: { services: true },
        },
      },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    // Get assigned location IDs and names
    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);
    const assignedLocationNames = manager.manager_locations.map((ml) => ml.locations.name);

    // Get assigned service slugs
    const assignedServiceSlugs = manager.manager_services.map((ms) => ms.services.slug);

    // If no locations or services assigned, return zero stats
    if (assignedLocationIds.length === 0 || assignedServiceSlugs.length === 0) {
      return NextResponse.json({
        totalBookings: 0,
        totalQuotes: 0,
        totalServices: 0,
        totalLocations: 0,
        totalVendors: 0,
        activeVendors: 0,
        bookingsByService: {},
        quotesByService: {},
        filter,
      });
    }

    // Helper function to check if service is assigned to manager
    const isServiceAssigned = (serviceSlug: string): boolean => {
      return assignedServiceSlugs.some(slug =>
        slug === serviceSlug ||
        slug.includes(serviceSlug) ||
        serviceSlug.includes(slug)
      );
    };

    // Build date filter
    const dateFilter = getDateRange(filter);
    const dateFilterObj = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // Filter for tables with locationId field (bike_bookings, self_drive)
    const locationIdFilter = {
      locationId: { in: assignedLocationIds },
      ...dateFilterObj,
    };

    // Filter for tables with pickupCity/locationName field (bus, car, chauffeur, etc.)
    const pickupCityFilter = {
      pickupCity: { in: assignedLocationNames },
      ...dateFilterObj,
    };

    // Filter for tables with locationName field (packers, equipment, etc.)
    const locationNameFilter = {
      locationName: { in: assignedLocationNames },
      ...dateFilterObj,
    };

    // Fetch total bookings from all services (COUNT, not fetch)
    // Only count services assigned to the manager
    const [
      bikeBookings,
      busBookings,
      carBookings,
      chauffeurBookings,
      equipmentBookings,
      luxuryBookings,
      packersBookings,
      truckBookings,
    ] = await Promise.all([
      // bike-rental
      isServiceAssigned('bike-rental') || isServiceAssigned('bike')
        ? prisma.bike_bookings.count({ where: locationIdFilter }).catch(() => 0)
        : Promise.resolve(0),
      // bus-rental
      isServiceAssigned('bus-rental') || isServiceAssigned('bus')
        ? prisma.bus_bookings.count({ where: pickupCityFilter }).catch(() => 0)
        : Promise.resolve(0),
      // self-drive-car-rental
      isServiceAssigned('self-drive-car-rental') || isServiceAssigned('self-drive')
        ? prisma.car_bookings.count({ where: locationIdFilter }).catch(() => 0)
        : Promise.resolve(0),
      // chauffeur-driven-car-rental / car-rental
      isServiceAssigned('chauffeur-driven-car-rental') || isServiceAssigned('car-rental') || isServiceAssigned('chauffeur')
        ? prisma.chauffeur_bookings.count({ where: pickupCityFilter }).catch(() => 0)
        : Promise.resolve(0),
      // equipment-rental
      isServiceAssigned('equipment-rental') || isServiceAssigned('equipment')
        ? prisma.equipment_bookings.count({ where: locationNameFilter }).catch(() => 0)
        : Promise.resolve(0),
      // luxury-car-rental / luxury
      isServiceAssigned('luxury-car-rental') || isServiceAssigned('luxury')
        ? prisma.luxury_bookings.count({ where: pickupCityFilter }).catch(() => 0)
        : Promise.resolve(0),
      // packers-and-movers / packers-movers
      isServiceAssigned('packers-and-movers') || isServiceAssigned('packers-movers')
        ? prisma.packers_bookings.count({ where: locationNameFilter }).catch(() => 0)
        : Promise.resolve(0),
      // truck-transport / truck
      isServiceAssigned('truck-transport') || isServiceAssigned('truck')
        ? prisma.truck_bookings.count({ where: pickupCityFilter }).catch(() => 0)
        : Promise.resolve(0),
    ]);

    const totalBookings = bikeBookings + busBookings + carBookings + chauffeurBookings +
                         equipmentBookings + luxuryBookings + packersBookings + truckBookings;

    // Fetch total quote requests from all services
    // Only count services assigned to the manager
    const [
      bikeQuotes,
      busQuotes,
      equipmentQuotes,
      luxuryQuotes,
      packersQuotes,
      selfDriveQuotes,
      truckQuotes,
    ] = await Promise.all([
      // bike-rental
      isServiceAssigned('bike-rental') || isServiceAssigned('bike')
        ? prisma.bike_quote_requests.count({ where: locationIdFilter }).catch(() => 0)
        : Promise.resolve(0),
      // bus-rental
      isServiceAssigned('bus-rental') || isServiceAssigned('bus')
        ? prisma.bus_quote_requests.count({ where: pickupCityFilter }).catch(() => 0)
        : Promise.resolve(0),
      // equipment-rental
      isServiceAssigned('equipment-rental') || isServiceAssigned('equipment')
        ? prisma.equipment_quote_requests.count({ where: locationNameFilter }).catch(() => 0)
        : Promise.resolve(0),
      // luxury-car-rental / luxury
      isServiceAssigned('luxury-car-rental') || isServiceAssigned('luxury')
        ? prisma.luxury_quote_requests.count({ where: pickupCityFilter }).catch(() => 0)
        : Promise.resolve(0),
      // packers-and-movers / packers-movers
      isServiceAssigned('packers-and-movers') || isServiceAssigned('packers-movers')
        ? prisma.packers_quote_requests.count({ where: locationNameFilter }).catch(() => 0)
        : Promise.resolve(0),
      // self-drive-car-rental
      isServiceAssigned('self-drive-car-rental') || isServiceAssigned('self-drive')
        ? prisma.self_drive_quote_requests.count({ where: locationIdFilter }).catch(() => 0)
        : Promise.resolve(0),
      // truck-transport / truck
      isServiceAssigned('truck-transport') || isServiceAssigned('truck')
        ? prisma.truck_quote_requests.count({ where: pickupCityFilter }).catch(() => 0)
        : Promise.resolve(0),
    ]);

    const totalQuotes = bikeQuotes + busQuotes + equipmentQuotes + luxuryQuotes +
                       packersQuotes + selfDriveQuotes + truckQuotes;

    // Get assigned service IDs for vendor filtering
    const assignedServiceIds = manager.manager_services.map((ms) => ms.serviceId);

    // Count vendors in manager's assigned locations AND services
    const [totalVendors, activeVendors] = await Promise.all([
      prisma.vendors.count({
        where: {
          AND: [
            {
              OR: [
                {
                  vendor_approved_locations: {
                    some: {
                      locationId: { in: assignedLocationIds },
                    },
                  },
                },
                {
                  vendor_location_requests: {
                    some: {
                      locationId: { in: assignedLocationIds },
                    },
                  },
                },
              ],
            },
            {
              OR: [
                {
                  vendor_approved_services: {
                    some: {
                      serviceId: { in: assignedServiceIds },
                    },
                  },
                },
                {
                  vendor_service_requests: {
                    some: {
                      serviceId: { in: assignedServiceIds },
                    },
                  },
                },
              ],
            },
          ],
        },
      }),
      prisma.vendors.count({
        where: {
          status: 'APPROVED',
          vendor_approved_locations: {
            some: {
              locationId: { in: assignedLocationIds },
            },
          },
          vendor_approved_services: {
            some: {
              serviceId: { in: assignedServiceIds },
            },
          },
        },
      }),
    ]);

    // Service and location breakdown - only include assigned services
    const bookingsByService: { [key: string]: number } = {};
    const quotesByService: { [key: string]: number } = {};

    // Add services only if they are assigned to the manager
    if (isServiceAssigned('bike-rental') || isServiceAssigned('bike')) {
      bookingsByService['Bike Rental'] = bikeBookings;
      quotesByService['Bike Rental'] = bikeQuotes;
    }
    if (isServiceAssigned('self-drive-car-rental') || isServiceAssigned('self-drive')) {
      bookingsByService['Self Drive'] = carBookings;
      quotesByService['Self Drive'] = selfDriveQuotes;
    }
    if (isServiceAssigned('bus-rental') || isServiceAssigned('bus')) {
      bookingsByService['Bus Rental'] = busBookings;
      quotesByService['Bus Rental'] = busQuotes;
    }
    if (isServiceAssigned('chauffeur-driven-car-rental') || isServiceAssigned('car-rental') || isServiceAssigned('chauffeur')) {
      bookingsByService['Car Rental'] = chauffeurBookings;
    }
    if (isServiceAssigned('equipment-rental') || isServiceAssigned('equipment')) {
      bookingsByService['Equipment'] = equipmentBookings;
      quotesByService['Equipment'] = equipmentQuotes;
    }
    if (isServiceAssigned('luxury-car-rental') || isServiceAssigned('luxury')) {
      bookingsByService['Luxury Cars'] = luxuryBookings;
      quotesByService['Luxury Cars'] = luxuryQuotes;
    }
    if (isServiceAssigned('packers-and-movers') || isServiceAssigned('packers-movers')) {
      bookingsByService['Packers & Movers'] = packersBookings;
      quotesByService['Packers & Movers'] = packersQuotes;
    }
    if (isServiceAssigned('truck-transport') || isServiceAssigned('truck')) {
      bookingsByService['Truck Rental'] = truckBookings;
      quotesByService['Truck Rental'] = truckQuotes;
    }

    return NextResponse.json({
      totalBookings,
      totalQuotes,
      totalServices: manager.manager_services.length,
      totalLocations: manager.manager_locations.length,
      totalVendors,
      activeVendors,
      bookingsByService,
      quotesByService,
      filter,
      assignedLocations: manager.manager_locations.map((ml) => ({
        id: ml.locations.id,
        name: ml.locations.name,
        slug: ml.locations.slug,
        type: ml.locations.type,
      })),
      assignedServices: manager.manager_services.map((ms) => ({
        id: ms.services.id,
        name: ms.services.name,
        slug: ms.services.slug,
      })),
    });
  } catch (error: any) {
    logger.error('Manager dashboard stats error', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: error?.message },
      { status: 500 }
    );
  }
}
