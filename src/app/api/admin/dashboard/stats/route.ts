import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

// Each quote-request table uses its own pickup-date column name.
const QUOTE_REQUEST_TABLES = {
  bike_quote_requests: 'pickupDate',
  bus_quote_requests: 'pickupDate',
  equipment_quote_requests: 'startDate',
  luxury_quote_requests: 'pickupDate',
  packers_quote_requests: 'preferredDate',
  self_drive_quote_requests: 'pickupDate',
  truck_quote_requests: 'pickupDate',
} as const;
type QuoteRequestTable = keyof typeof QUOTE_REQUEST_TABLES;

// Same person + same pickup date + same service = 1 quote request
// (collapses multi-vehicle requests by one customer for one trip).
async function countDistinctQuoteRequests(
  table: QuoteRequestTable,
  dateFilter: { gte?: Date; lt?: Date; lte?: Date },
): Promise<number> {
  const dateColumn = QUOTE_REQUEST_TABLES[table];
  if (!dateColumn) {
    throw new Error(`Invalid quote request table: ${table}`);
  }

  const conditions: Prisma.Sql[] = [];
  if (dateFilter.gte !== undefined) conditions.push(Prisma.sql`createdAt >= ${dateFilter.gte}`);
  if (dateFilter.lt !== undefined) conditions.push(Prisma.sql`createdAt < ${dateFilter.lt}`);
  if (dateFilter.lte !== undefined) conditions.push(Prisma.sql`createdAt <= ${dateFilter.lte}`);

  const whereClause = conditions.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
    : Prisma.empty;

  const tableSql = Prisma.raw(`\`${table}\``);
  const dateColSql = Prisma.raw(`\`${dateColumn}\``);

  const rows = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    SELECT COUNT(DISTINCT CONCAT(customerPhone, '|', DATE(${dateColSql}))) AS count
    FROM ${tableSql}
    ${whereClause}
  `);

  return Number(rows[0]?.count ?? 0);
}

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

    // Fetch bookings from all services. CUSTOM_BULK rows live in
    // b2b_bookings.serviceType — count them separately so they show up as
    // their own slice on the dashboard chart.
    const [
      bikeBookings,
      busBookings,
      carBookings,
      chauffeurBookings,
      equipmentBookings,
      luxuryBookings,
      packersBookings,
      truckBookings,
      bulkBookings,
    ] = await Promise.all([
      prisma.bike_bookings.count({ where: { createdAt: dateFilter } }),
      prisma.bus_bookings.count({ where: { createdAt: dateFilter } }),
      prisma.car_bookings.count({ where: { createdAt: dateFilter } }),
      prisma.chauffeur_bookings.count({ where: { createdAt: dateFilter } }),
      prisma.equipment_bookings.count({ where: { createdAt: dateFilter } }),
      prisma.luxury_bookings.count({ where: { createdAt: dateFilter } }),
      prisma.packers_bookings.count({ where: { createdAt: dateFilter } }),
      prisma.truck_bookings.count({ where: { createdAt: dateFilter } }),
      prisma.b2b_bookings.count({ where: { createdAt: dateFilter, serviceType: 'CUSTOM_BULK' } }),
    ]);

    const totalBookings = bikeBookings + busBookings + carBookings + chauffeurBookings +
                         equipmentBookings + luxuryBookings + packersBookings + truckBookings +
                         bulkBookings;

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
      countDistinctQuoteRequests('bike_quote_requests', dateFilter),
      countDistinctQuoteRequests('bus_quote_requests', dateFilter),
      countDistinctQuoteRequests('equipment_quote_requests', dateFilter),
      countDistinctQuoteRequests('luxury_quote_requests', dateFilter),
      countDistinctQuoteRequests('packers_quote_requests', dateFilter),
      countDistinctQuoteRequests('self_drive_quote_requests', dateFilter),
      countDistinctQuoteRequests('truck_quote_requests', dateFilter),
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
      'Bulk Events': bulkBookings,
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
    // For locations, count places where services operate (CITY, UNION_TERRITORY, VILLAGE)
    const [totalServices, totalLocations] = await Promise.all([
      prisma.services.count({ where: { isActive: true } }),
      prisma.locations.count({
        where: {
          isActive: true,
          type: {
            in: ['CITY', 'UNION_TERRITORY', 'VILLAGE']
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
