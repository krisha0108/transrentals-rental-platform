import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// Helper function to get date ranges based on filter
function getDateRange(filter: string, customFrom?: string | null, customTo?: string | null) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
  const mondayThisWeek = new Date(today);
  mondayThisWeek.setDate(today.getDate() - dayOfWeek);

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  switch (filter) {
    case 'today':
      return { gte: today, lte: endOfToday };
    case 'yesterday':
      return { gte: yesterday, lt: today };
    case 'thisWeek':
      return { gte: mondayThisWeek, lte: endOfToday };
    case 'thisMonth':
      return { gte: thisMonthStart, lte: endOfToday };
    case 'lastMonth':
      return { gte: lastMonthStart, lte: lastMonthEnd };
    case 'custom': {
      const range: { gte?: Date; lte?: Date } = {};
      if (customFrom) range.gte = new Date(customFrom + 'T00:00:00');
      if (customTo) range.lte = new Date(customTo + 'T23:59:59.999');
      return range;
    }
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
    const filter = searchParams.get('filter') || 'today';
    const customFrom = searchParams.get('dateFrom');
    const customTo = searchParams.get('dateTo');

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
    const dateFilter = getDateRange(filter, customFrom, customTo);
    const dateFilterObj = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // Filter for tables with locationId field (bike_bookings, self_drive)
    const locationIdFilter = {
      locationId: { in: assignedLocationIds },
      ...dateFilterObj,
    };

    // Filter for tables with a pickupCity field (bus, chauffeur, luxury, truck,
    // packers — packers_bookings/packers_quote_requests use pickupCity too).
    const pickupCityFilter = {
      pickupCity: { in: assignedLocationNames },
      ...dateFilterObj,
    };

    // equipment_bookings/equipment_quote_requests have neither locationName nor
    // pickupCity — their location column is deliveryCity.
    const deliveryCityFilter = {
      deliveryCity: { in: assignedLocationNames },
      ...dateFilterObj,
    };

    // Every table's .count() below is wrapped in this instead of a bare
    // `.catch(() => 0)` — a schema mismatch (wrong field name on a table)
    // throws a Prisma validation error, and silently turning that into 0
    // is exactly what hid the equipment/packers stats always reading zero
    // for months. Still resilient (one bad table doesn't 500 the whole
    // dashboard), but now it leaves a trace.
    const countOrZero = (promise: Promise<number>, label: string): Promise<number> =>
      promise.catch((error) => {
        logger.error(`Manager dashboard stats: ${label} count failed`, error);
        return 0;
      });

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
      isServiceAssigned('bike-rental') || isServiceAssigned('bike') || isServiceAssigned('bike-on-rent')
        ? countOrZero(prisma.bike_bookings.count({ where: locationIdFilter }), 'bike_bookings')
        : Promise.resolve(0),
      // bus-rental
      isServiceAssigned('bus-rental') || isServiceAssigned('bus')
        ? countOrZero(prisma.bus_bookings.count({ where: pickupCityFilter }), 'bus_bookings')
        : Promise.resolve(0),
      // self-drive-car-rental
      isServiceAssigned('self-drive-car-rental') || isServiceAssigned('self-drive')
        ? countOrZero(prisma.car_bookings.count({ where: locationIdFilter }), 'car_bookings')
        : Promise.resolve(0),
      // chauffeur-driven-car-rental / car-rental
      isServiceAssigned('chauffeur-driven-car-rental') || isServiceAssigned('car-rental') || isServiceAssigned('chauffeur')
        ? countOrZero(prisma.chauffeur_bookings.count({ where: pickupCityFilter }), 'chauffeur_bookings')
        : Promise.resolve(0),
      // equipment-rental — equipment_bookings has no locationName/pickupCity, only deliveryCity
      isServiceAssigned('equipment-rental') || isServiceAssigned('equipment')
        ? countOrZero(prisma.equipment_bookings.count({ where: deliveryCityFilter }), 'equipment_bookings')
        : Promise.resolve(0),
      // luxury-car-rental / luxury
      isServiceAssigned('luxury-car-rental') || isServiceAssigned('luxury')
        ? countOrZero(prisma.luxury_bookings.count({ where: pickupCityFilter }), 'luxury_bookings')
        : Promise.resolve(0),
      // packers-and-movers / packers-movers — packers_bookings has no locationName, uses pickupCity
      isServiceAssigned('packers-and-movers') || isServiceAssigned('packers-movers')
        ? countOrZero(prisma.packers_bookings.count({ where: pickupCityFilter }), 'packers_bookings')
        : Promise.resolve(0),
      // truck-transport / truck
      isServiceAssigned('truck-transport') || isServiceAssigned('truck')
        ? countOrZero(prisma.truck_bookings.count({ where: pickupCityFilter }), 'truck_bookings')
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
      isServiceAssigned('bike-rental') || isServiceAssigned('bike') || isServiceAssigned('bike-on-rent')
        ? countOrZero(prisma.bike_quote_requests.count({ where: locationIdFilter }), 'bike_quote_requests')
        : Promise.resolve(0),
      // bus-rental
      isServiceAssigned('bus-rental') || isServiceAssigned('bus')
        ? countOrZero(prisma.bus_quote_requests.count({ where: pickupCityFilter }), 'bus_quote_requests')
        : Promise.resolve(0),
      // equipment-rental — equipment_quote_requests has no locationName/pickupCity, only deliveryCity
      isServiceAssigned('equipment-rental') || isServiceAssigned('equipment')
        ? countOrZero(prisma.equipment_quote_requests.count({ where: deliveryCityFilter }), 'equipment_quote_requests')
        : Promise.resolve(0),
      // luxury-car-rental / luxury
      isServiceAssigned('luxury-car-rental') || isServiceAssigned('luxury')
        ? countOrZero(prisma.luxury_quote_requests.count({ where: pickupCityFilter }), 'luxury_quote_requests')
        : Promise.resolve(0),
      // packers-and-movers / packers-movers — packers_quote_requests has no locationName, uses pickupCity
      isServiceAssigned('packers-and-movers') || isServiceAssigned('packers-movers')
        ? countOrZero(prisma.packers_quote_requests.count({ where: pickupCityFilter }), 'packers_quote_requests')
        : Promise.resolve(0),
      // self-drive-car-rental
      isServiceAssigned('self-drive-car-rental') || isServiceAssigned('self-drive')
        ? countOrZero(prisma.self_drive_quote_requests.count({ where: locationIdFilter }), 'self_drive_quote_requests')
        : Promise.resolve(0),
      // truck-transport / truck
      isServiceAssigned('truck-transport') || isServiceAssigned('truck')
        ? countOrZero(prisma.truck_quote_requests.count({ where: pickupCityFilter }), 'truck_quote_requests')
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
    if (isServiceAssigned('bike-rental') || isServiceAssigned('bike') || isServiceAssigned('bike-on-rent')) {
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
