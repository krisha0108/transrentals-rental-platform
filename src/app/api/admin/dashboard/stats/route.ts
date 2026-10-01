import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getInquiryGeoBreakdown, getCoverageGaps, getIdleVendorCoverage } from '@/lib/admin-operations';

export const dynamic = 'force-dynamic';

// Each quote-request table uses its own pickup-date column name, and its own
// column for "which city was this quote for" (see CITY_COLUMNS below).
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
  cityColumn: string,
  city?: string,
  cityNames?: string[],
): Promise<number> {
  const dateColumn = QUOTE_REQUEST_TABLES[table];
  if (!dateColumn) {
    throw new Error(`Invalid quote request table: ${table}`);
  }

  const conditions: Prisma.Sql[] = [];
  if (dateFilter.gte !== undefined) conditions.push(Prisma.sql`createdAt >= ${dateFilter.gte}`);
  if (dateFilter.lt !== undefined) conditions.push(Prisma.sql`createdAt < ${dateFilter.lt}`);
  if (dateFilter.lte !== undefined) conditions.push(Prisma.sql`createdAt <= ${dateFilter.lte}`);
  if (city) {
    conditions.push(Prisma.sql`${Prisma.raw(`\`${cityColumn}\``)} = ${city}`);
  } else if (cityNames && cityNames.length > 0) {
    conditions.push(Prisma.sql`${Prisma.raw(`\`${cityColumn}\``)} IN (${Prisma.join(cityNames)})`);
  }

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

// Which column holds "the city this booking/quote is for" on each table —
// they were built independently and never agreed on one name.
const BOOKING_CITY_COLUMN = {
  bike_bookings: 'locationName',
  car_bookings: 'locationName',
  chauffeur_bookings: 'locationName',
  luxury_bookings: 'locationName',
  bus_bookings: 'pickupCity',
  packers_bookings: 'pickupCity',
  truck_bookings: 'pickupCity',
  equipment_bookings: 'deliveryCity',
  b2b_bookings: 'pickupLocation',
} as const;

const QUOTE_CITY_COLUMN: Record<QuoteRequestTable, string> = {
  bike_quote_requests: 'locationName',
  self_drive_quote_requests: 'locationName',
  bus_quote_requests: 'pickupCity',
  luxury_quote_requests: 'pickupCity',
  packers_quote_requests: 'pickupCity',
  truck_quote_requests: 'pickupCity',
  equipment_quote_requests: 'deliveryCity',
};

function cityWhere(table: keyof typeof BOOKING_CITY_COLUMN, city?: string, cityNames?: string[]) {
  if (city) return { [BOOKING_CITY_COLUMN[table]]: city };
  if (cityNames && cityNames.length > 0) return { [BOOKING_CITY_COLUMN[table]]: { in: cityNames } };
  return {};
}

// Helper function to get date ranges based on filter
function getDateRange(filter: string, customFrom?: string, customTo?: string) {
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
    case 'custom': {
      const ymd = /^\d{4}-\d{2}-\d{2}$/;
      if (!customFrom || !ymd.test(customFrom)) return {};

      // A range with no end is still a single day, which keeps the older
      // single-date callers working unchanged.
      const to = customTo && ymd.test(customTo) ? customTo : customFrom;

      // Swap if they arrive the wrong way round rather than returning nothing.
      const [fromStr, toStr] = customFrom <= to ? [customFrom, to] : [to, customFrom];

      const [fy, fm, fd] = fromStr.split('-').map(Number);
      const [ty, tm, td] = toStr.split('-').map(Number);
      const start = new Date(fy, fm - 1, fd);
      // Exclusive upper bound on the day after, so the whole end day counts.
      const end = new Date(ty, tm - 1, td + 1);
      return { gte: start, lt: end };
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
    // `date` is the original single-day param; `from`/`to` are the range.
    const customFrom = searchParams.get('from') || searchParams.get('date') || undefined;
    const customTo = searchParams.get('to') || undefined;
    const locationParam = searchParams.get('location') || 'all';
    const city = locationParam === 'all' ? undefined : locationParam;
    const stateParam = searchParams.get('state') || 'all';

    const dateFilter = getDateRange(filter, customFrom, customTo);

    // A state only narrows things when no specific city is already picked —
    // a city filter is more specific and wins.
    let cityNamesInState: string[] | undefined;
    if (stateParam !== 'all' && !city) {
      const citiesInState = await prisma.locations.findMany({
        where: { parentId: stateParam, isActive: true, type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] } },
        select: { name: true },
      });
      cityNamesInState = Array.from(new Set(citiesInState.map((c) => c.name)));
    }

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
      prisma.bike_bookings.count({ where: { createdAt: dateFilter, ...cityWhere('bike_bookings', city, cityNamesInState) } }),
      prisma.bus_bookings.count({ where: { createdAt: dateFilter, ...cityWhere('bus_bookings', city, cityNamesInState) } }),
      prisma.car_bookings.count({ where: { createdAt: dateFilter, ...cityWhere('car_bookings', city, cityNamesInState) } }),
      prisma.chauffeur_bookings.count({ where: { createdAt: dateFilter, ...cityWhere('chauffeur_bookings', city, cityNamesInState) } }),
      prisma.equipment_bookings.count({ where: { createdAt: dateFilter, ...cityWhere('equipment_bookings', city, cityNamesInState) } }),
      prisma.luxury_bookings.count({ where: { createdAt: dateFilter, ...cityWhere('luxury_bookings', city, cityNamesInState) } }),
      prisma.packers_bookings.count({ where: { createdAt: dateFilter, ...cityWhere('packers_bookings', city, cityNamesInState) } }),
      prisma.truck_bookings.count({ where: { createdAt: dateFilter, ...cityWhere('truck_bookings', city, cityNamesInState) } }),
      prisma.b2b_bookings.count({ where: { createdAt: dateFilter, serviceType: 'CUSTOM_BULK', ...cityWhere('b2b_bookings', city, cityNamesInState) } }),
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
      countDistinctQuoteRequests('bike_quote_requests', dateFilter, QUOTE_CITY_COLUMN.bike_quote_requests, city, cityNamesInState),
      countDistinctQuoteRequests('bus_quote_requests', dateFilter, QUOTE_CITY_COLUMN.bus_quote_requests, city, cityNamesInState),
      countDistinctQuoteRequests('equipment_quote_requests', dateFilter, QUOTE_CITY_COLUMN.equipment_quote_requests, city, cityNamesInState),
      countDistinctQuoteRequests('luxury_quote_requests', dateFilter, QUOTE_CITY_COLUMN.luxury_quote_requests, city, cityNamesInState),
      countDistinctQuoteRequests('packers_quote_requests', dateFilter, QUOTE_CITY_COLUMN.packers_quote_requests, city, cityNamesInState),
      countDistinctQuoteRequests('self_drive_quote_requests', dateFilter, QUOTE_CITY_COLUMN.self_drive_quote_requests, city, cityNamesInState),
      countDistinctQuoteRequests('truck_quote_requests', dateFilter, QUOTE_CITY_COLUMN.truck_quote_requests, city, cityNamesInState),
    ]);

    const totalQuotes = bikeQuotes + busQuotes + equipmentQuotes + luxuryQuotes +
                       packersQuotes + selfDriveQuotes + truckQuotes;

    // Highest state/city — for inquiries (quote requests, every service) and
    // for active vendor supply — both scoped to the same date/location/state
    // filter as everything else on this page, so "today's top state" always
    // means the same date window across every number shown.
    const inquiryGeoFilterObj = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};
    const geoFilter = city ? { cityName: city } : cityNamesInState ? { cityNamesInState } : undefined;
    const [inquiryGeo, vendorRows, coverageGaps, idleVendors] = await Promise.all([
      getInquiryGeoBreakdown(inquiryGeoFilterObj, geoFilter),
      prisma.vendors.findMany({
        where: {
          createdAt: dateFilter,
          status: 'APPROVED',
          ...(city ? { city } : cityNamesInState ? { city: { in: cityNamesInState } } : {}),
        },
        select: { city: true, state: true },
      }),
      // Demand with NO vendor — a customer inquired and there was nobody to
      // serve them. Admin-wide, not scoped to the location/state filter above
      // (same as how Operations Tracker shows it).
      getCoverageGaps(inquiryGeoFilterObj, { limit: 1 }),
      // The flip side — vendors sitting idle with zero inquiries in the period.
      getIdleVendorCoverage(inquiryGeoFilterObj, { limit: 1 }),
    ]);

    const vendorStateCounts = new Map<string, number>();
    const vendorCityCounts = new Map<string, number>();
    for (const v of vendorRows) {
      const vState = v.state || 'Unknown';
      const vCity = v.city || 'Unknown';
      vendorStateCounts.set(vState, (vendorStateCounts.get(vState) || 0) + 1);
      vendorCityCounts.set(vCity, (vendorCityCounts.get(vCity) || 0) + 1);
    }
    const topOf = (m: Map<string, number>) => {
      let best: { name: string; count: number } | null = null;
      for (const [name, count] of m.entries()) {
        if (!best || count > best.count) best = { name, count };
      }
      return best;
    };
    const topVendorState = topOf(vendorStateCounts);
    const topVendorCity = topOf(vendorCityCounts);

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
    const [totalServices, totalLocations, locationRows, stateRows] = await Promise.all([
      prisma.services.count({ where: { isActive: true } }),
      prisma.locations.count({
        where: {
          isActive: true,
          type: {
            in: ['CITY', 'UNION_TERRITORY', 'VILLAGE']
          }
        }
      }),
      // Every city, kept alongside its state (parentId) so the UI can narrow
      // the city dropdown once a state is picked — several rows can share a
      // name (e.g. two "Bijapur" entries in different states), which is why
      // this isn't de-duplicated by name alone.
      prisma.locations.findMany({
        where: { isActive: true, type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] } },
        select: { name: true, parentId: true },
        orderBy: { name: 'asc' },
      }),
      prisma.locations.findMany({
        where: { isActive: true, type: 'STATE' },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    const availableLocations = Array.from(new Set(locationRows.map((l) => l.name))).sort();

    return NextResponse.json({
      totalBookings,
      totalQuotes,
      totalServices,
      totalLocations,
      bookingsByService,
      quotesByService,
      filter,
      location: locationParam,
      availableLocations,
      state: stateParam,
      states: stateRows,
      cities: locationRows,
      topInquiryState: inquiryGeo.topState,
      topInquiryCity: inquiryGeo.topCity,
      topVendorState,
      topVendorCity,
      totalVendorsInPeriod: vendorRows.length,
      // Inquiries with no vendor to serve them — lost business.
      coverageGapEvents: coverageGaps.total,
      coverageGapLocations: coverageGaps.groupsTotal,
      topCoverageGap: coverageGaps.items[0] || null,
      // Vendors with capacity but zero inquiries in the period — unused supply.
      // The real vendor headcount — `idleVendors.total` counts (location x
      // service) combos, which balloons for any vendor approved across many
      // locations/services and is NOT how many vendors this is.
      idleVendorCount: idleVendors.idleVendorCount,
      idleVendorPairs: idleVendors.total,
      topIdleLocation: idleVendors.byLocation[0] || null,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
