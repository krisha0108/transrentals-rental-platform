import { prisma } from '@/lib/db/prisma';

// Shared by /api/admin/managers/performance (list) and .../performance/detail
// (single manager) — keeps the inquiry/booking/vendor counting logic in one
// place so fixes (e.g. service-slug aliasing) don't drift between the two.

export type DateFilterObj = { createdAt: { gte?: Date; lte?: Date; lt?: Date } } | {};

type ManagerWithAssignments = {
  id: string;
  manager_locations: { locationId: string; locations: { name: string | null } | null }[];
  manager_services: { serviceId: string; services: { slug: string | null } | null }[];
};

export interface ManagerStats {
  vendors: { created: number; approved: number };
  inquiries: { total: number; actioned: number; coveragePct: number | null };
  bookings: { total: number; actioned: number; coveragePct: number | null };
  actionBreakdown: Record<string, number>;
}

export async function computeManagerStats(
  manager: ManagerWithAssignments,
  dateFilterObj: DateFilterObj
): Promise<ManagerStats> {
  const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);
  const assignedLocationNames = manager.manager_locations.map((ml) => ml.locations?.name).filter(Boolean) as string[];
  const assignedServiceIds = manager.manager_services.map((ms) => ms.serviceId);
  const assignedServiceSlugs = manager.manager_services.map((ms) => ms.services?.slug).filter(Boolean) as string[];

  const empty: ManagerStats = {
    vendors: { created: 0, approved: 0 },
    inquiries: { total: 0, actioned: 0, coveragePct: null },
    bookings: { total: 0, actioned: 0, coveragePct: null },
    actionBreakdown: {},
  };

  // Vendors created/approved by this manager — date-scoped by the action's own
  // timestamp (createdAt / approvedAt), independent of location/service scope,
  // since createdById/approvedById already identifies the manager directly.
  const createdAtRange = 'createdAt' in dateFilterObj ? dateFilterObj.createdAt : undefined;
  const [vendorsCreated, vendorsApproved] = await Promise.all([
    prisma.vendors.count({
      where: { createdById: manager.id, ...(createdAtRange ? { createdAt: createdAtRange } : {}) },
    }).catch(() => 0),
    prisma.vendors.count({
      where: { approvedById: manager.id, ...(createdAtRange ? { approvedAt: createdAtRange } : {}) },
    }).catch(() => 0),
  ]);

  if (assignedLocationIds.length === 0 || assignedServiceSlugs.length === 0) {
    return { ...empty, vendors: { created: vendorsCreated, approved: vendorsApproved } };
  }

  const isAssigned = (slug: string, alts: string[]) =>
    assignedServiceSlugs.some((s) => s === slug || alts.includes(s));

  const locationIdFilter = { locationId: { in: assignedLocationIds }, ...dateFilterObj };
  const pickupCityFilter = { pickupCity: { in: assignedLocationNames }, ...dateFilterObj };
  const deliveryCityFilter = { deliveryCity: { in: assignedLocationNames }, ...dateFilterObj };

  // ── Inquiries (quote requests) ──
  const [bikeQ, busQ, selfDriveQ, equipmentQ, luxuryQ, packersQ, truckQ] = await Promise.all([
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
      ? prisma.packers_quote_requests.findMany({ where: pickupCityFilter, select: { id: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('truck-transport', ['truck', 'transporter'])
      ? prisma.truck_quote_requests.findMany({ where: pickupCityFilter, select: { id: true } }).catch(() => [])
      : Promise.resolve([]),
  ]);
  const inquiryIds = [...bikeQ, ...busQ, ...selfDriveQ, ...equipmentQ, ...luxuryQ, ...packersQ, ...truckQ].map((r) => r.id);

  // ── Bookings ──
  const [bikeB, busB, carB, chauffeurB, equipmentB, luxuryB, packersB, truckB] = await Promise.all([
    isAssigned('bike-rental', ['bike', 'bike-on-rent'])
      ? prisma.bike_bookings.findMany({ where: locationIdFilter, select: { id: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('bus-rental', ['bus'])
      ? prisma.bus_bookings.findMany({ where: pickupCityFilter, select: { id: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('self-drive-car-rental', ['self-drive'])
      ? prisma.car_bookings.findMany({ where: locationIdFilter, select: { id: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('chauffeur-driven-car-rental', ['car-rental', 'chauffeur'])
      ? prisma.chauffeur_bookings.findMany({ where: pickupCityFilter, select: { id: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('equipment-rental', ['equipment'])
      ? prisma.equipment_bookings.findMany({ where: deliveryCityFilter, select: { id: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('luxury-car-rental', ['luxury'])
      ? prisma.luxury_bookings.findMany({ where: pickupCityFilter, select: { id: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('packers-and-movers', ['packers-movers'])
      ? prisma.packers_bookings.findMany({ where: pickupCityFilter, select: { id: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('truck-transport', ['truck'])
      ? prisma.truck_bookings.findMany({ where: pickupCityFilter, select: { id: true } }).catch(() => [])
      : Promise.resolve([]),
  ]);
  const bookingIds = [...bikeB, ...busB, ...carB, ...chauffeurB, ...equipmentB, ...luxuryB, ...packersB, ...truckB].map((r) => r.id);

  // "Actioned" is scored by when the manager LOGGED the action (createdAt on the
  // log row), not when the inquiry/booking itself was created — a manager
  // clearing older backlog today is real coverage and must count under "Today".
  const [inquiryActionGroups, bookingActionGroups, breakdownGroups] = await Promise.all([
    prisma.manager_action_logs.groupBy({
      by: ['recordId'],
      where: { recordType: 'INQUIRY', managerId: manager.id, ...dateFilterObj },
      _count: { recordId: true },
    }).catch(() => []),
    prisma.manager_action_logs.groupBy({
      by: ['recordId'],
      where: { recordType: 'BOOKING', managerId: manager.id, ...dateFilterObj },
      _count: { recordId: true },
    }).catch(() => []),
    prisma.manager_action_logs.groupBy({
      by: ['actionType'],
      where: { managerId: manager.id, ...dateFilterObj },
      _count: { actionType: true },
    }).catch(() => []),
  ]);

  const inquiriesTotal = inquiryIds.length;
  const inquiriesActioned = inquiryActionGroups.length;
  const bookingsTotal = bookingIds.length;
  const bookingsActioned = bookingActionGroups.length;

  return {
    vendors: { created: vendorsCreated, approved: vendorsApproved },
    inquiries: {
      total: inquiriesTotal,
      actioned: inquiriesActioned,
      coveragePct: inquiriesTotal > 0 ? Math.round((inquiriesActioned / inquiriesTotal) * 100) : null,
    },
    bookings: {
      total: bookingsTotal,
      actioned: bookingsActioned,
      coveragePct: bookingsTotal > 0 ? Math.round((bookingsActioned / bookingsTotal) * 100) : null,
    },
    actionBreakdown: Object.fromEntries(breakdownGroups.map((g) => [g.actionType, g._count.actionType])),
  };
}

// Same date-range convention used across the manager dashboard / performance routes.
export function getDateRange(filter: string, customFrom?: string | null, customTo?: string | null) {
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
