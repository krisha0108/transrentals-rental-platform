import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

function getDateRange(filter: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  switch (filter) {
    case 'today':     return { gte: today };
    case 'yesterday': return { gte: yesterday, lt: today };
    case 'thisMonth': return { gte: thisMonthStart };
    case 'lastMonth': return { gte: lastMonthStart, lte: lastMonthEnd };
    default:          return {};
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const dateFilter = getDateRange(filter);
    const where = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    // Fetch city-grouped data from all services in parallel.
    // Note: Car Rental (chauffeur-driven) has no separate quote_requests table —
    // chauffeur_bookings itself acts as the quote/lifecycle tracker (PENDING_PAYMENT → assigned → accepted),
    // matching the convention used in /api/admin/dashboard/stats.
    const [
      busGroups, luxuryGroups, packersGroups, truckGroups, equipmentGroups,
      bikeGroups, selfDriveGroups, carGroups,
    ] = await Promise.all([
      prisma.bus_quote_requests.groupBy({
        by: ['pickupCity'],
        _count: { id: true },
        where: { ...where, pickupCity: { not: null, not: '' } },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.luxury_quote_requests.groupBy({
        by: ['pickupCity'],
        _count: { id: true },
        where: { ...where, pickupCity: { not: null, not: '' } },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.packers_quote_requests.groupBy({
        by: ['pickupCity'],
        _count: { id: true },
        where: { ...where, pickupCity: { not: null, not: '' } },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.truck_quote_requests.groupBy({
        by: ['pickupCity'],
        _count: { id: true },
        where: { ...where, pickupCity: { not: null, not: '' } },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.equipment_quote_requests.groupBy({
        by: ['deliveryCity'],
        _count: { id: true },
        where: { ...where, deliveryCity: { not: null, not: '' } },
        orderBy: { _count: { id: 'desc' } },
      }),
      (prisma as any).bike_quote_requests.groupBy({
        by: ['locationName'],
        _count: { id: true },
        where: { ...where, locationName: { not: null, not: '' } },
        orderBy: { _count: { id: 'desc' } },
      }),
      (prisma as any).self_drive_quote_requests.groupBy({
        by: ['locationName'],
        _count: { id: true },
        where: { ...where, locationName: { not: null, not: '' } },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.chauffeur_bookings.groupBy({
        by: ['pickupCity'],
        _count: { id: true },
        where: { ...where, pickupCity: { not: '' } },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    // Aggregate into two parallel maps from raw groupBy results:
    //   cityMap    — city → { total, byService }      (used to build top-N cities for the map)
    //   serviceMap — service → { total, topCity, cities[] }  (used for service-level breakdowns)
    // Each ingest() call updates BOTH so per-service city lists aren't truncated by the top-N filter.
    const cityMap: Record<string, { total: number; byService: Record<string, number> }> = {};
    const serviceMap: Record<string, { total: number; topCity: string; cities: { city: string; count: number }[] }> = {};
    // city-within-service accumulator, so duplicate city names (different casing/whitespace from raw data)
    // are merged into a single row per service before sorting
    const serviceCityTotals: Record<string, Record<string, number>> = {};

    function ingest(groups: any[], serviceLabel: string, cityField: string) {
      if (!serviceMap[serviceLabel]) serviceMap[serviceLabel] = { total: 0, topCity: '', cities: [] };
      if (!serviceCityTotals[serviceLabel]) serviceCityTotals[serviceLabel] = {};

      for (const g of groups) {
        const city = (g[cityField] || '').trim();
        const count = g._count?.id || 0;
        if (!city || !count) continue;

        // service totals — counted across ALL cities, not just map's top-N
        serviceMap[serviceLabel].total += count;
        serviceCityTotals[serviceLabel][city] = (serviceCityTotals[serviceLabel][city] || 0) + count;

        // city totals — feeds the map
        if (!cityMap[city]) cityMap[city] = { total: 0, byService: {} };
        cityMap[city].total += count;
        cityMap[city].byService[serviceLabel] = (cityMap[city].byService[serviceLabel] || 0) + count;
      }
    }

    ingest(busGroups,       'Bus Rental',       'pickupCity');
    ingest(luxuryGroups,    'Luxury Cars',      'pickupCity');
    ingest(packersGroups,   'Packers & Movers', 'pickupCity');
    ingest(truckGroups,     'Truck Rental',     'pickupCity');
    ingest(equipmentGroups, 'Equipment',        'deliveryCity');
    ingest(bikeGroups,      'Bike Rental',      'locationName');
    ingest(selfDriveGroups, 'Self Drive',       'locationName');
    ingest(carGroups,       'Car Rental',       'pickupCity');

    // Materialize per-service city lists: sort by count desc, set topCity
    for (const [label, svc] of Object.entries(serviceMap)) {
      svc.cities = Object.entries(serviceCityTotals[label] || {})
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count);
      svc.topCity = svc.cities[0]?.city || '';
    }

    // Top 20 cities by total bookings across all services — for map dots
    const topCities = Object.entries(cityMap)
      .map(([city, data]) => ({ city, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    return NextResponse.json({ topCities, byService: serviceMap, filter });
  } catch (error) {
    console.error('[Quote City Stats]', error);
    return NextResponse.json({ error: 'Failed to fetch city stats' }, { status: 500 });
  }
}
