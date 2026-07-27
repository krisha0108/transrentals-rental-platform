import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// Same date-range convention as /api/manager/dashboard/stats and the admin/manager vendor lists.
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

// GET — per-manager inquiry/booking coverage for a date range: how many inquiries/bookings
// fell in a manager's assigned locations+services, and how many of those they actually
// logged an action against. Powers the admin "Manager Performance" tracking page.
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
    const filter = searchParams.get('filter') || 'today';
    const customFrom = searchParams.get('dateFrom');
    const customTo = searchParams.get('dateTo');
    const dateFilter = getDateRange(filter, customFrom, customTo);
    const dateFilterObj = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const managers = await prisma.admin_users.findMany({
      where: { role: 'MANAGER' },
      include: {
        manager_locations: { include: { locations: true } },
        manager_services: { include: { services: true } },
      },
      orderBy: { name: 'asc' },
    });

    const results = await Promise.all(managers.map(async (manager) => {
      const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);
      const assignedLocationNames = manager.manager_locations.map((ml) => ml.locations?.name).filter(Boolean) as string[];
      const assignedServiceSlugs = manager.manager_services.map((ms) => ms.services?.slug).filter(Boolean) as string[];

      if (assignedLocationIds.length === 0 || assignedServiceSlugs.length === 0) {
        return {
          id: manager.id,
          name: manager.name,
          email: manager.email,
          inquiries: { total: 0, actioned: 0, coveragePct: 0 },
          actionBreakdown: {},
        };
      }

      const isAssigned = (slug: string, alts: string[]) =>
        assignedServiceSlugs.some((s) => s === slug || alts.includes(s));

      const locationIdFilter = { locationId: { in: assignedLocationIds }, ...dateFilterObj };
      const pickupCityFilter = { pickupCity: { in: assignedLocationNames }, ...dateFilterObj };
      const locationNameFilter = { locationName: { in: assignedLocationNames }, ...dateFilterObj };
      const deliveryCityFilter = { deliveryCity: { in: assignedLocationNames }, ...dateFilterObj };
      const packersPickupFilter = { pickupCity: { in: assignedLocationNames }, ...dateFilterObj };

      const [bikeIds, busIds, selfDriveIds, equipmentIds, luxuryIds, packersIds, truckIds] = await Promise.all([
        isAssigned('bike-rental', ['bike', 'bike-on-rent'])
          ? prisma.bike_quote_requests.findMany({ where: locationIdFilter, select: { id: true } }).catch(() => [])
          : Promise.resolve([]),
        isAssigned('bus-rental', ['bus'])
          ? prisma.bus_quote_requests.findMany({ where: pickupCityFilter, select: { id: true } }).catch(() => [])
          : Promise.resolve([]),
        isAssigned('self-drive', ['self-drive-car-rentals', 'self-drive-car-rental'])
          ? prisma.self_drive_quote_requests.findMany({ where: locationIdFilter, select: { id: true } }).catch(() => [])
          : Promise.resolve([]),
        isAssigned('equipment-rental', ['equipment'])
          ? prisma.equipment_quote_requests.findMany({ where: deliveryCityFilter, select: { id: true } }).catch(() => [])
          : Promise.resolve([]),
        isAssigned('luxury-car-rental', ['luxury'])
          ? prisma.luxury_quote_requests.findMany({ where: pickupCityFilter, select: { id: true } }).catch(() => [])
          : Promise.resolve([]),
        isAssigned('packers-and-movers', ['packers-movers'])
          ? prisma.packers_quote_requests.findMany({ where: packersPickupFilter, select: { id: true } }).catch(() => [])
          : Promise.resolve([]),
        isAssigned('truck-transport', ['truck', 'transporter'])
          ? prisma.truck_quote_requests.findMany({ where: pickupCityFilter, select: { id: true } }).catch(() => [])
          : Promise.resolve([]),
      ]);

      const allInquiryIds = [
        ...bikeIds, ...busIds, ...selfDriveIds, ...equipmentIds, ...luxuryIds, ...packersIds, ...truckIds,
      ].map((r) => r.id);

      let actionedCount = 0;
      let actionBreakdown: Record<string, number> = {};
      if (allInquiryIds.length > 0) {
        const [actionedGroups, breakdownGroups] = await Promise.all([
          prisma.manager_action_logs.groupBy({
            by: ['recordId'],
            where: { recordType: 'INQUIRY', managerId: manager.id, recordId: { in: allInquiryIds } },
            _count: { recordId: true },
          }).catch(() => []),
          prisma.manager_action_logs.groupBy({
            by: ['actionType'],
            where: { recordType: 'INQUIRY', managerId: manager.id, recordId: { in: allInquiryIds } },
            _count: { actionType: true },
          }).catch(() => []),
        ]);
        actionedCount = actionedGroups.length;
        actionBreakdown = Object.fromEntries(breakdownGroups.map((g) => [g.actionType, g._count.actionType]));
      }

      const total = allInquiryIds.length;
      return {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        inquiries: {
          total,
          actioned: actionedCount,
          coveragePct: total > 0 ? Math.round((actionedCount / total) * 100) : null,
        },
        actionBreakdown,
      };
    }));

    // Sort by lowest coverage first — surfaces managers who need attention.
    results.sort((a, b) => {
      const aPct = a.inquiries.coveragePct ?? 101;
      const bPct = b.inquiries.coveragePct ?? 101;
      return aPct - bPct;
    });

    return NextResponse.json({ filter, managers: results });
  } catch (error: any) {
    logger.error('Manager performance fetch error', error);
    return NextResponse.json(
      { error: 'Failed to fetch manager performance', details: error?.message },
      { status: 500 }
    );
  }
}
