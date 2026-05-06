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

    // Fetch city-grouped data from all services in parallel
    const [
      busGroups, luxuryGroups, packersGroups, truckGroups, equipmentGroups,
      bikeGroups, selfDriveGroups,
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
    ]);

    // Merge all cities into a single map: city → { total, byService }
    const cityMap: Record<string, { total: number; byService: Record<string, number> }> = {};

    function addToMap(groups: any[], serviceLabel: string, cityField: string) {
      for (const g of groups) {
        const city = (g[cityField] || '').trim();
        if (!city) continue;
        if (!cityMap[city]) cityMap[city] = { total: 0, byService: {} };
        const cnt = g._count?.id || 0;
        cityMap[city].total += cnt;
        cityMap[city].byService[serviceLabel] = (cityMap[city].byService[serviceLabel] || 0) + cnt;
      }
    }

    addToMap(busGroups,       'Bus Rental',        'pickupCity');
    addToMap(luxuryGroups,    'Luxury Cars',       'pickupCity');
    addToMap(packersGroups,   'Packers & Movers',  'pickupCity');
    addToMap(truckGroups,     'Truck Rental',      'pickupCity');
    addToMap(equipmentGroups, 'Equipment',         'deliveryCity');
    addToMap(bikeGroups,      'Bike Rental',       'locationName');
    addToMap(selfDriveGroups, 'Self Drive',        'locationName');

    // Sort cities by total, take top 15
    const topCities = Object.entries(cityMap)
      .map(([city, data]) => ({ city, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);

    // Build service-wise summary: which service gets most requests and from which top city
    const serviceMap: Record<string, { total: number; topCity: string; cities: { city: string; count: number }[] }> = {};

    for (const { city, byService } of topCities) {
      for (const [service, count] of Object.entries(byService)) {
        if (!serviceMap[service]) serviceMap[service] = { total: 0, topCity: '', cities: [] };
        serviceMap[service].total += count;
        serviceMap[service].cities.push({ city, count });
      }
    }

    // Also aggregate services that might not appear in top 15 cities
    function addServiceTotal(groups: any[], serviceLabel: string, cityField: string) {
      const total = groups.reduce((s: number, g: any) => s + (g._count?.id || 0), 0);
      if (!serviceMap[serviceLabel]) serviceMap[serviceLabel] = { total: 0, topCity: '', cities: [] };
      const existing = serviceMap[serviceLabel].total;
      if (total > existing) serviceMap[serviceLabel].total = total;
      if (groups.length > 0) {
        const top = groups[0];
        const topCity = (top[cityField] || '').trim();
        if (topCity && !serviceMap[serviceLabel].topCity) serviceMap[serviceLabel].topCity = topCity;
      }
    }

    addServiceTotal(busGroups,       'Bus Rental',       'pickupCity');
    addServiceTotal(luxuryGroups,    'Luxury Cars',      'pickupCity');
    addServiceTotal(packersGroups,   'Packers & Movers', 'pickupCity');
    addServiceTotal(truckGroups,     'Truck Rental',     'pickupCity');
    addServiceTotal(equipmentGroups, 'Equipment',        'deliveryCity');
    addServiceTotal(bikeGroups,      'Bike Rental',      'locationName');
    addServiceTotal(selfDriveGroups, 'Self Drive',       'locationName');

    // Sort each service's cities and pick topCity
    for (const svc of Object.values(serviceMap)) {
      svc.cities.sort((a, b) => b.count - a.count);
      if (!svc.topCity && svc.cities.length > 0) svc.topCity = svc.cities[0].city;
    }

    return NextResponse.json({ topCities, byService: serviceMap, filter });
  } catch (error) {
    console.error('[Quote City Stats]', error);
    return NextResponse.json({ error: 'Failed to fetch city stats' }, { status: 500 });
  }
}
