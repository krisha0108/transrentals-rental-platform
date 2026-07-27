import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

function getDateRange(filter: string, customFrom?: string | null, customTo?: string | null) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dayOfWeek = (now.getDay() + 6) % 7;
  const mondayThisWeek = new Date(today);
  mondayThisWeek.setDate(today.getDate() - dayOfWeek);

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  switch (filter) {
    case 'today': return { gte: today, lte: endOfToday };
    case 'yesterday': return { gte: yesterday, lt: today };
    case 'thisWeek': return { gte: mondayThisWeek, lte: endOfToday };
    case 'thisMonth': return { gte: thisMonthStart, lte: endOfToday };
    case 'lastMonth': return { gte: lastMonthStart, lte: lastMonthEnd };
    case 'custom': {
      const range: { gte?: Date; lte?: Date } = {};
      if (customFrom) range.gte = new Date(customFrom + 'T00:00:00');
      if (customTo) range.lte = new Date(customTo + 'T23:59:59.999');
      return range;
    }
    case 'all':
    default: return {};
  }
}

// GET — drill-down list of inquiries in a manager's scope+date-range that they
// have NOT logged any action against. ?managerId=&filter=&dateFrom=&dateTo=
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get('managerId');
    if (!managerId) {
      return NextResponse.json({ error: 'managerId is required' }, { status: 400 });
    }
    const filter = searchParams.get('filter') || 'today';
    const customFrom = searchParams.get('dateFrom');
    const customTo = searchParams.get('dateTo');
    const dateFilter = getDateRange(filter, customFrom, customTo);
    const dateFilterObj = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const manager = await prisma.admin_users.findUnique({
      where: { id: managerId },
      include: {
        manager_locations: { include: { locations: true } },
        manager_services: { include: { services: true } },
      },
    });
    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);
    const assignedLocationNames = manager.manager_locations.map((ml) => ml.locations?.name).filter(Boolean) as string[];
    const assignedServiceSlugs = manager.manager_services.map((ms) => ms.services?.slug).filter(Boolean) as string[];

    const isAssigned = (slug: string, alts: string[]) =>
      assignedServiceSlugs.some((s) => s === slug || alts.includes(s));

    const locationIdFilter = { locationId: { in: assignedLocationIds }, ...dateFilterObj };
    const pickupCityFilter = { pickupCity: { in: assignedLocationNames }, ...dateFilterObj };
    const deliveryCityFilter = { deliveryCity: { in: assignedLocationNames }, ...dateFilterObj };
    const packersPickupFilter = { pickupCity: { in: assignedLocationNames }, ...dateFilterObj };

    const customerSelect = { select: { name: true, phone: true } } as const;

    const [bike, bus, selfDrive, equipment, luxury, packers, truck] = await Promise.all([
      isAssigned('bike-rental', ['bike', 'bike-on-rent'])
        ? prisma.bike_quote_requests.findMany({ where: locationIdFilter, select: { id: true, requestNumber: true, customerName: true, customerPhone: true, createdAt: true, locationName: true, customers: customerSelect } }).catch(() => [])
        : Promise.resolve([]),
      isAssigned('bus-rental', ['bus'])
        ? prisma.bus_quote_requests.findMany({ where: pickupCityFilter, select: { id: true, requestNumber: true, customerName: true, customerPhone: true, createdAt: true, pickupCity: true, customers: customerSelect } }).catch(() => [])
        : Promise.resolve([]),
      isAssigned('self-drive', ['self-drive-car-rentals', 'self-drive-car-rental'])
        ? prisma.self_drive_quote_requests.findMany({ where: locationIdFilter, select: { id: true, requestNumber: true, customerName: true, customerPhone: true, createdAt: true, locationName: true, customers: customerSelect } }).catch(() => [])
        : Promise.resolve([]),
      isAssigned('equipment-rental', ['equipment'])
        ? prisma.equipment_quote_requests.findMany({ where: deliveryCityFilter, select: { id: true, requestNumber: true, customerName: true, customerPhone: true, createdAt: true, deliveryCity: true, customers: customerSelect } }).catch(() => [])
        : Promise.resolve([]),
      isAssigned('luxury-car-rental', ['luxury'])
        ? prisma.luxury_quote_requests.findMany({ where: pickupCityFilter, select: { id: true, requestNumber: true, customerName: true, customerPhone: true, createdAt: true, pickupCity: true, customers: customerSelect } }).catch(() => [])
        : Promise.resolve([]),
      isAssigned('packers-and-movers', ['packers-movers'])
        ? prisma.packers_quote_requests.findMany({ where: packersPickupFilter, select: { id: true, requestNumber: true, customerName: true, customerPhone: true, createdAt: true, pickupCity: true, customers: customerSelect } }).catch(() => [])
        : Promise.resolve([]),
      isAssigned('truck-transport', ['truck', 'transporter'])
        ? prisma.truck_quote_requests.findMany({ where: pickupCityFilter, select: { id: true, requestNumber: true, customerName: true, customerPhone: true, createdAt: true, pickupCity: true, customers: customerSelect } }).catch(() => [])
        : Promise.resolve([]),
    ]);

    const all = [
      ...bike.map((r: any) => ({ ...r, serviceName: 'Bike Rental', locationName: r.locationName })),
      ...bus.map((r: any) => ({ ...r, serviceName: 'Bus Rental', locationName: r.pickupCity })),
      ...selfDrive.map((r: any) => ({ ...r, serviceName: 'Self Drive', locationName: r.locationName })),
      ...equipment.map((r: any) => ({ ...r, serviceName: 'Equipment Rental', locationName: r.deliveryCity })),
      ...luxury.map((r: any) => ({ ...r, serviceName: 'Luxury Cars', locationName: r.pickupCity })),
      ...packers.map((r: any) => ({ ...r, serviceName: 'Packers & Movers', locationName: r.pickupCity })),
      ...truck.map((r: any) => ({ ...r, serviceName: 'Truck Transport', locationName: r.pickupCity })),
    ];

    const allIds = all.map((r) => r.id);
    const actionedRecordIds = allIds.length > 0
      ? await prisma.manager_action_logs.findMany({
          where: { recordType: 'INQUIRY', managerId, recordId: { in: allIds } },
          select: { recordId: true },
          distinct: ['recordId'],
        }).catch(() => [])
      : [];
    const actionedSet = new Set(actionedRecordIds.map((r) => r.recordId));

    const untouched = all
      .filter((r) => !actionedSet.has(r.id))
      .map((r: any) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        customerName: r.customers?.name || r.customerName,
        customerPhone: r.customers?.phone || r.customerPhone,
        serviceName: r.serviceName,
        locationName: r.locationName,
        createdAt: r.createdAt,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ manager: { id: manager.id, name: manager.name }, untouched });
  } catch (error: any) {
    logger.error('Manager untouched-inquiries fetch error', error);
    return NextResponse.json(
      { error: 'Failed to fetch untouched inquiries', details: error?.message },
      { status: 500 }
    );
  }
}
