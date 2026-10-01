import { prisma } from '@/lib/db/prisma';
import { getPresenceStatus, type PresenceStatus } from '@/lib/presence';

export { getPresenceStatus, type PresenceStatus };

// Shared by /api/admin/managers/performance (list) and .../performance/detail
// (single manager) — keeps the inquiry/booking/vendor counting logic in one
// place so fixes (e.g. service-slug aliasing) don't drift between the two.

export type DateFilterObj = { createdAt: { gte?: Date; lte?: Date; lt?: Date } } | {};

// Whether `date` falls inside the selected period — `{}` (All Time) matches
// everything, since there's no "before the period" when the period is all of
// time.
function inDateRange(date: Date, dateFilterObj: DateFilterObj): boolean {
  if (!('createdAt' in dateFilterObj)) return true;
  const { gte, lte, lt } = dateFilterObj.createdAt;
  if (gte && date < gte) return false;
  if (lte && date > lte) return false;
  if (lt && date >= lt) return false;
  return true;
}

type ManagerWithAssignments = {
  id: string;
  manager_locations: { locationId: string; locations: { name: string | null } | null }[];
  manager_services: { serviceId: string; services: { slug: string | null } | null }[];
};

export interface ManagerStats {
  vendors: { created: number; approved: number };
  // `actioned` only counts inquiries CREATED inside the selected period — so
  // coveragePct (actioned/total) can never exceed 100%. `actionedBacklog` is
  // the separate, additional credit for inquiries created BEFORE the period
  // but worked during it (e.g. clearing yesterday's backlog today) — real
  // coverage, just not comparable against this period's own `total`, so it's
  // reported alongside rather than folded into the same ratio.
  inquiries: { total: number; actioned: number; actionedBacklog: number; coveragePct: number | null };
  bookings: { total: number; actioned: number; actionedBacklog: number; coveragePct: number | null };
  // contact_inquiries has no location/service scoping (the public /contact
  // form is fully anonymous — see QuotePaymentSafetyNotice work) — every
  // manager can act on the same shared, unscoped queue, so there's no
  // "assigned total" to build a coverage ratio against. Just a count.
  contactInquiries: { actioned: number };
  // Call reports are the manager's own outbound work — vendor and travel-agent
  // leads they chased. Like contact inquiries there is no assigned queue to
  // measure coverage against, so this is a straight count of reports logged.
  callReports: { logged: number; converted: number };
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
    inquiries: { total: 0, actioned: 0, actionedBacklog: 0, coveragePct: null },
    bookings: { total: 0, actioned: 0, actionedBacklog: 0, coveragePct: null },
    contactInquiries: { actioned: 0 },
    callReports: { logged: 0, converted: 0 },
    actionBreakdown: {},
  };

  // Vendors created/approved by this manager — date-scoped by the action's own
  // timestamp (createdAt / approvedAt), independent of location/service scope,
  // since createdById/approvedById already identifies the manager directly.
  const createdAtRange = 'createdAt' in dateFilterObj ? dateFilterObj.createdAt : undefined;
  const [vendorsCreated, vendorsApproved, contactInquiriesActioned, callReportsLogged, callReportsConverted] = await Promise.all([
    prisma.vendors.count({
      where: { createdById: manager.id, ...(createdAtRange ? { createdAt: createdAtRange } : {}) },
    }).catch(() => 0),
    prisma.vendors.count({
      where: { approvedById: manager.id, ...(createdAtRange ? { approvedAt: createdAtRange } : {}) },
    }).catch(() => 0),
    // Same reasoning as vendors above — contact_inquiries has no
    // location/service scope, so this is computed independent of assignment.
    prisma.manager_action_logs.count({
      where: { recordType: 'CONTACT_INQUIRY', managerId: manager.id, ...dateFilterObj },
    }).catch(() => 0),
    // Counted from the reports themselves rather than the action log: a report
    // that is created and then followed up writes several log rows, and the
    // headline number should be "leads worked", not "times touched".
    prisma.manager_call_reports.count({
      where: { managerId: manager.id, ...(createdAtRange ? { createdAt: createdAtRange } : {}) },
    }).catch(() => 0),
    prisma.manager_call_reports.count({
      where: {
        managerId: manager.id,
        status: { in: ['CONVERTED', 'VENDOR_CREATED', 'TRAVEL_AGENT_CREATED'] },
        ...(createdAtRange ? { createdAt: createdAtRange } : {}),
      },
    }).catch(() => 0),
  ]);

  if (assignedLocationIds.length === 0 || assignedServiceSlugs.length === 0) {
    return {
      ...empty,
      vendors: { created: vendorsCreated, approved: vendorsApproved },
      contactInquiries: { actioned: contactInquiriesActioned },
      callReports: { logged: callReportsLogged, converted: callReportsConverted },
    };
  }

  const isAssigned = (slug: string, alts: string[]) =>
    assignedServiceSlugs.some((s) => s === slug || alts.includes(s));

  // Scope only — NOT date-filtered. Fetching the manager's whole current
  // scope (with createdAt) and partitioning by date in JS, instead of
  // filtering at the query level, is what lets "actioned" distinguish
  // in-period work from backlog: both need to know whether an id was
  // created inside the period or just happens to be in scope.
  const locationIdFilter = { locationId: { in: assignedLocationIds } };
  const pickupCityFilter = { pickupCity: { in: assignedLocationNames } };
  const deliveryCityFilter = { deliveryCity: { in: assignedLocationNames } };

  // ── Inquiries (quote requests) ──
  const [bikeQ, busQ, selfDriveQ, equipmentQ, luxuryQ, packersQ, truckQ] = await Promise.all([
    isAssigned('bike-rental', ['bike', 'bike-on-rent'])
      ? prisma.bike_quote_requests.findMany({ where: locationIdFilter, select: { id: true, createdAt: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('bus-rental', ['bus'])
      ? prisma.bus_quote_requests.findMany({ where: pickupCityFilter, select: { id: true, createdAt: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('self-drive', ['self-drive-car-rentals', 'self-drive-car-rental'])
      ? prisma.self_drive_quote_requests.findMany({ where: locationIdFilter, select: { id: true, createdAt: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('equipment-rental', ['equipment'])
      ? prisma.equipment_quote_requests.findMany({ where: deliveryCityFilter, select: { id: true, createdAt: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('luxury-car-rental', ['luxury'])
      ? prisma.luxury_quote_requests.findMany({ where: pickupCityFilter, select: { id: true, createdAt: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('packers-and-movers', ['packers-movers'])
      ? prisma.packers_quote_requests.findMany({ where: pickupCityFilter, select: { id: true, createdAt: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('truck-transport', ['truck', 'transporter'])
      ? prisma.truck_quote_requests.findMany({ where: pickupCityFilter, select: { id: true, createdAt: true } }).catch(() => [])
      : Promise.resolve([]),
  ]);
  const allScopedInquiries = [...bikeQ, ...busQ, ...selfDriveQ, ...equipmentQ, ...luxuryQ, ...packersQ, ...truckQ];
  const inquiryIds = allScopedInquiries.filter((r) => inDateRange(r.createdAt, dateFilterObj)).map((r) => r.id);
  const inquiryIdsAllScope = allScopedInquiries.map((r) => r.id);

  // ── Bookings ──
  const [bikeB, busB, carB, chauffeurB, equipmentB, luxuryB, packersB, truckB] = await Promise.all([
    isAssigned('bike-rental', ['bike', 'bike-on-rent'])
      ? prisma.bike_bookings.findMany({ where: locationIdFilter, select: { id: true, createdAt: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('bus-rental', ['bus'])
      ? prisma.bus_bookings.findMany({ where: pickupCityFilter, select: { id: true, createdAt: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('self-drive-car-rental', ['self-drive'])
      ? prisma.car_bookings.findMany({ where: locationIdFilter, select: { id: true, createdAt: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('chauffeur-driven-car-rental', ['car-rental', 'chauffeur'])
      ? prisma.chauffeur_bookings.findMany({ where: pickupCityFilter, select: { id: true, createdAt: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('equipment-rental', ['equipment'])
      ? prisma.equipment_bookings.findMany({ where: deliveryCityFilter, select: { id: true, createdAt: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('luxury-car-rental', ['luxury'])
      ? prisma.luxury_bookings.findMany({ where: pickupCityFilter, select: { id: true, createdAt: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('packers-and-movers', ['packers-movers'])
      ? prisma.packers_bookings.findMany({ where: pickupCityFilter, select: { id: true, createdAt: true } }).catch(() => [])
      : Promise.resolve([]),
    isAssigned('truck-transport', ['truck'])
      ? prisma.truck_bookings.findMany({ where: pickupCityFilter, select: { id: true, createdAt: true } }).catch(() => [])
      : Promise.resolve([]),
  ]);
  const allScopedBookings = [...bikeB, ...busB, ...carB, ...chauffeurB, ...equipmentB, ...luxuryB, ...packersB, ...truckB];
  const bookingIds = allScopedBookings.filter((r) => inDateRange(r.createdAt, dateFilterObj)).map((r) => r.id);
  const bookingIdsAllScope = allScopedBookings.map((r) => r.id);

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

  // A manager's action-log history outlives their CURRENT assignment — if
  // their locations/services were ever reassigned, the log still has rows
  // for records no longer in scope at all; those are dropped entirely (never
  // counted — there's no current "total" they could sensibly belong to).
  //
  // Of what IS in current scope, a logged action lands in one of two buckets:
  //  - the record was also CREATED in this period  -> `actioned` (makes
  //    coveragePct = actioned/total a true, never-over-100% ratio)
  //  - the record predates the period (backlog cleared during it)  ->
  //    `actionedBacklog` — real, additional work, reported alongside rather
  //    than folded into the same ratio since it's a different denominator.
  const inquiryIdSet = new Set(inquiryIds);
  const inquiryAllScopeSet = new Set(inquiryIdsAllScope);
  const bookingIdSet = new Set(bookingIds);
  const bookingAllScopeSet = new Set(bookingIdsAllScope);

  const inquiriesTotal = inquiryIds.length;
  let inquiriesActioned = 0;
  let inquiriesActionedBacklog = 0;
  for (const g of inquiryActionGroups) {
    if (inquiryIdSet.has(g.recordId)) inquiriesActioned++;
    else if (inquiryAllScopeSet.has(g.recordId)) inquiriesActionedBacklog++;
  }

  const bookingsTotal = bookingIds.length;
  let bookingsActioned = 0;
  let bookingsActionedBacklog = 0;
  for (const g of bookingActionGroups) {
    if (bookingIdSet.has(g.recordId)) bookingsActioned++;
    else if (bookingAllScopeSet.has(g.recordId)) bookingsActionedBacklog++;
  }

  return {
    vendors: { created: vendorsCreated, approved: vendorsApproved },
    inquiries: {
      total: inquiriesTotal,
      actioned: inquiriesActioned,
      actionedBacklog: inquiriesActionedBacklog,
      coveragePct: inquiriesTotal > 0 ? Math.round((inquiriesActioned / inquiriesTotal) * 100) : null,
    },
    bookings: {
      total: bookingsTotal,
      actioned: bookingsActioned,
      actionedBacklog: bookingsActionedBacklog,
      coveragePct: bookingsTotal > 0 ? Math.round((bookingsActioned / bookingsTotal) * 100) : null,
    },
    contactInquiries: { actioned: contactInquiriesActioned },
    callReports: { logged: callReportsLogged, converted: callReportsConverted },
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

