import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

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
    const filter = searchParams.get('filter') || 'today';

    const dateFilter = getDateRange(filter);

    // Fetch bookings from all services
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
      prisma.bike_bookings.count({ where: { createdAt: dateFilter } }),
      prisma.bus_bookings.count({ where: { createdAt: dateFilter } }),
      prisma.car_bookings.count({ where: { createdAt: dateFilter } }),
      prisma.chauffeur_bookings.count({ where: { createdAt: dateFilter } }),
      prisma.equipment_bookings.count({ where: { createdAt: dateFilter } }),
      prisma.luxury_bookings.count({ where: { createdAt: dateFilter } }),
      prisma.packers_bookings.count({ where: { createdAt: dateFilter } }),
      prisma.truck_bookings.count({ where: { createdAt: dateFilter } }),
    ]);

    const totalBookings = bikeBookings + busBookings + carBookings + chauffeurBookings +
                         equipmentBookings + luxuryBookings + packersBookings + truckBookings;

    // Fetch quote requests from all services
    const [
      bikeQuotes,
      busQuotes,
      equipmentQuotes,
      luxuryQuotes,
      packersQuotes,
      selfDriveQuotes,
      truckQuotes,
    ] = await Promise.all([
      prisma.bike_quote_requests.count({ where: { createdAt: dateFilter } }),
      prisma.bus_quote_requests.count({ where: { createdAt: dateFilter } }),
      prisma.equipment_quote_requests.count({ where: { createdAt: dateFilter } }),
      prisma.luxury_quote_requests.count({ where: { createdAt: dateFilter } }),
      prisma.packers_quote_requests.count({ where: { createdAt: dateFilter } }),
      prisma.self_drive_quote_requests.count({ where: { createdAt: dateFilter } }),
      prisma.truck_quote_requests.count({ where: { createdAt: dateFilter } }),
    ]);

    const totalQuotes = bikeQuotes + busQuotes + equipmentQuotes + luxuryQuotes +
                       packersQuotes + selfDriveQuotes + truckQuotes;

    // Fetch breakdown by service
    const bookingsByService = {
      'Bike Rental': bikeBookings,
      'Self Drive': carBookings,
      'Bus Rental': busBookings,
      'Car Rental': chauffeurBookings,
      'Equipment': equipmentBookings,
      'Luxury Cars': luxuryBookings,
      'Packers & Movers': packersBookings,
      'Truck Rental': truckBookings,
    };

    const quotesByService = {
      'Bike Rental': bikeQuotes,
      'Self Drive': selfDriveQuotes,
      'Bus Rental': busQuotes,
      'Equipment': equipmentQuotes,
      'Luxury Cars': luxuryQuotes,
      'Packers & Movers': packersQuotes,
      'Truck Rental': truckQuotes,
    };

    // Fetch services and locations counts (no date filter needed)
    // For locations, only count CITY and UNION_TERRITORY (exclude STATE, COUNTRY, AREA, AIRPORT)
    const [totalServices, totalLocations] = await Promise.all([
      prisma.services.count({ where: { isActive: true } }),
      prisma.locations.count({
        where: {
          isActive: true,
          type: {
            in: ['CITY', 'UNION_TERRITORY']
          }
        }
      }),
    ]);

    return NextResponse.json({
      totalBookings,
      totalQuotes,
      totalServices,
      totalLocations,
      bookingsByService,
      quotesByService,
      filter,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
