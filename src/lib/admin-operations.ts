// Admin-wide "Operations Tracker" data layer — everything computed here is
// deliberately NOT scoped to one manager's assigned locations/services (unlike
// manager-performance.ts), since the point of this page is a single admin-eye
// view across the whole business: what's been actioned, what hasn't, and
// where supply/demand don't line up.

import { prisma } from '@/lib/db/prisma';

export { getDateRange } from '@/lib/manager-performance';

export type DateFilterObj = { createdAt: { gte?: Date; lte?: Date; lt?: Date } } | {};

export interface TrackedItem {
  id: string;
  requestNumber: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  serviceSlug: string;
  locationName: string;
  createdAt: Date;
  /** Only set on inquiries — every quote-request table shares the same enum. */
  status?: string;
}

const customerSelect = { select: { name: true, phone: true } } as const;

// Hard cap per table so an unbounded "All Time" scan across the whole
// business can't blow up memory/time — realistic date ranges never get
// close to this, and hitting it just means results are a (clearly large)
// undercount rather than a crash.
const MAX_ROWS_PER_TABLE = 5000;

export interface PageParams {
  page?: number;
  limit?: number;
  search?: string;
  /** Exact city name — wins over `cityNamesInState` when both are given. */
  cityName?: string;
  /** Every city name belonging to one state, for a state-level filter. */
  cityNamesInState?: string[];
}
export interface PaginatedResult<T> { items: T[]; total: number; page: number; limit: number; totalPages: number }

// Every list in this file is built up in memory (it's a cross-table diff/join,
// not a single query), so pagination happens here rather than via SQL
// LIMIT/OFFSET — this just keeps the JSON payload sent to the browser (and
// the DOM it renders into) to one page's worth of rows instead of everything
// that matched the date range.
function paginate<T>(items: T[], page = 1, limit = 20): PaginatedResult<T> {
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * safeLimit;
  return { items: items.slice(start, start + safeLimit), total, page: safePage, limit: safeLimit, totalPages };
}

function matchesTrackedItemSearch(item: TrackedItem, q: string) {
  return item.customerName?.toLowerCase().includes(q)
    || item.customerPhone?.includes(q)
    || item.locationName?.toLowerCase().includes(q);
}

// ── Inquiries (admin-wide, every service, every location) ──

export async function getAllInquiries(dateFilterObj: DateFilterObj): Promise<TrackedItem[]> {
  const [bike, bus, selfDrive, equipment, luxury, packers, truck] = await Promise.all([
    prisma.bike_quote_requests.findMany({ where: dateFilterObj, take: MAX_ROWS_PER_TABLE, select: { id: true, requestNumber: true, customerName: true, customerPhone: true, createdAt: true, locationName: true, status: true, customers: customerSelect } }).catch(() => []),
    prisma.bus_quote_requests.findMany({ where: dateFilterObj, take: MAX_ROWS_PER_TABLE, select: { id: true, requestNumber: true, customerName: true, customerPhone: true, createdAt: true, pickupCity: true, status: true, customers: customerSelect } }).catch(() => []),
    prisma.self_drive_quote_requests.findMany({ where: dateFilterObj, take: MAX_ROWS_PER_TABLE, select: { id: true, requestNumber: true, customerName: true, customerPhone: true, createdAt: true, locationName: true, status: true, customers: customerSelect } }).catch(() => []),
    prisma.equipment_quote_requests.findMany({ where: dateFilterObj, take: MAX_ROWS_PER_TABLE, select: { id: true, requestNumber: true, customerName: true, customerPhone: true, createdAt: true, deliveryCity: true, status: true, customers: customerSelect } }).catch(() => []),
    prisma.luxury_quote_requests.findMany({ where: dateFilterObj, take: MAX_ROWS_PER_TABLE, select: { id: true, requestNumber: true, customerName: true, customerPhone: true, createdAt: true, pickupCity: true, status: true, customers: customerSelect } }).catch(() => []),
    prisma.packers_quote_requests.findMany({ where: dateFilterObj, take: MAX_ROWS_PER_TABLE, select: { id: true, requestNumber: true, customerName: true, customerPhone: true, createdAt: true, pickupCity: true, status: true, customers: customerSelect } }).catch(() => []),
    prisma.truck_quote_requests.findMany({ where: dateFilterObj, take: MAX_ROWS_PER_TABLE, select: { id: true, requestNumber: true, customerName: true, customerPhone: true, createdAt: true, pickupCity: true, status: true, customers: customerSelect } }).catch(() => []),
  ]);

  return [
    ...bike.map((r: any) => ({ id: r.id, requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, serviceName: 'Bike Rental', serviceSlug: 'bike-rental', locationName: r.locationName, createdAt: r.createdAt, status: r.status })),
    ...bus.map((r: any) => ({ id: r.id, requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, serviceName: 'Bus Rental', serviceSlug: 'bus-rental', locationName: r.pickupCity, createdAt: r.createdAt, status: r.status })),
    ...selfDrive.map((r: any) => ({ id: r.id, requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, serviceName: 'Self Drive', serviceSlug: 'self-drive', locationName: r.locationName, createdAt: r.createdAt, status: r.status })),
    ...equipment.map((r: any) => ({ id: r.id, requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, serviceName: 'Equipment Rental', serviceSlug: 'equipment-rental', locationName: r.deliveryCity, createdAt: r.createdAt, status: r.status })),
    ...luxury.map((r: any) => ({ id: r.id, requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, serviceName: 'Luxury Cars', serviceSlug: 'luxury-car-rental', locationName: r.pickupCity, createdAt: r.createdAt, status: r.status })),
    ...packers.map((r: any) => ({ id: r.id, requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, serviceName: 'Packers & Movers', serviceSlug: 'packers-and-movers', locationName: r.pickupCity, createdAt: r.createdAt, status: r.status })),
    ...truck.map((r: any) => ({ id: r.id, requestNumber: r.requestNumber, customerName: r.customers?.name || r.customerName, customerPhone: r.customers?.phone || r.customerPhone, serviceName: 'Truck Transport', serviceSlug: 'truck-transport', locationName: r.pickupCity, createdAt: r.createdAt, status: r.status })),
  ];
}

// ── Inquiries by geography — where inquiries are coming from, and what
// state they're stuck in, for a picked time period. ──

export interface InquiryGeoBreakdown {
  total: number;
  byStatus: { status: string; count: number }[];
  byState: { name: string; count: number }[];
  byCity: { name: string; count: number }[];
  topState: { name: string; count: number } | null;
  topCity: { name: string; count: number } | null;
}

// Cities never agreed on a shared schema (some store a locationId, several
// only ever stored a free-text city name), so a city's state comes from a
// best-effort name lookup — the first `locations` row matching that name,
// picked deterministically (ordered by id) so a duplicate city name always
// resolves to the same state on every call.
export async function getCityToStateMap(): Promise<Map<string, string>> {
  const cityRows = await prisma.locations.findMany({
    where: { type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] } },
    select: { name: true, locations: { select: { name: true } } },
    orderBy: { id: 'asc' },
  });
  const cityToState = new Map<string, string>();
  for (const c of cityRows) {
    if (!cityToState.has(c.name)) cityToState.set(c.name, c.locations?.name || 'Unknown');
  }
  return cityToState;
}

export interface InquiryGeoFilter {
  /** Exact city name — from a location dropdown. Wins over the other two. */
  cityName?: string;
  /** Every city name belonging to one state — from a state dropdown. */
  cityNamesInState?: string[];
  /** Case-insensitive partial state-name match — for free-text callers (the chat assistant). */
  stateNameContains?: string;
}

/**
 * @param filter When given, every returned field — total, byStatus, byCity —
 * is scoped to just the matching inquiries, not the whole period. Without it,
 * everything is admin-wide. Keeping the two modes in one function means a
 * caller can never accidentally mix a scoped count with an unscoped
 * city/status list (which reads, to whoever consumes it, as if that whole
 * list belonged to the filtered slice).
 */
export async function getInquiryGeoBreakdown(dateFilterObj: DateFilterObj, filter?: InquiryGeoFilter): Promise<InquiryGeoBreakdown> {
  const inquiries = await getAllInquiries(dateFilterObj);
  const cityToState = await getCityToStateMap();
  const stateQuery = filter?.stateNameContains?.toLowerCase();

  const statusCounts = new Map<string, number>();
  const stateCounts = new Map<string, number>();
  const cityCounts = new Map<string, number>();
  let total = 0;

  for (const inq of inquiries) {
    const city = inq.locationName || 'Unknown';
    const state = cityToState.get(city) || 'Unknown';

    if (filter?.cityName && city !== filter.cityName) continue;
    if (!filter?.cityName && filter?.cityNamesInState && !filter.cityNamesInState.includes(city)) continue;
    if (stateQuery && !state.toLowerCase().includes(stateQuery)) continue;

    total += 1;
    const status = inq.status || 'UNKNOWN';
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
    stateCounts.set(state, (stateCounts.get(state) || 0) + 1);
  }

  const toSortedArray = (m: Map<string, number>) =>
    Array.from(m.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const byState = toSortedArray(stateCounts);
  const byCity = toSortedArray(cityCounts);

  return {
    total,
    byStatus: Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
    byState,
    byCity,
    topState: byState[0] || null,
    topCity: byCity[0] || null,
  };
}

// ── Bookings (admin-wide) ──

export async function getAllBookings(dateFilterObj: DateFilterObj): Promise<TrackedItem[]> {
  const [bike, bus, car, chauffeur, equipment, luxury, packers, truck] = await Promise.all([
    prisma.bike_bookings.findMany({ where: dateFilterObj, take: MAX_ROWS_PER_TABLE, select: { id: true, bookingNumber: true, customerName: true, customerPhone: true, createdAt: true, locationName: true } }).catch(() => []),
    prisma.bus_bookings.findMany({ where: dateFilterObj, take: MAX_ROWS_PER_TABLE, select: { id: true, bookingNumber: true, customerName: true, customerPhone: true, createdAt: true, pickupCity: true } }).catch(() => []),
    prisma.car_bookings.findMany({ where: dateFilterObj, take: MAX_ROWS_PER_TABLE, select: { id: true, bookingNumber: true, customerName: true, customerPhone: true, createdAt: true, locationName: true } }).catch(() => []),
    prisma.chauffeur_bookings.findMany({ where: dateFilterObj, take: MAX_ROWS_PER_TABLE, select: { id: true, bookingNumber: true, customerName: true, customerPhone: true, createdAt: true, locationName: true } }).catch(() => []),
    prisma.equipment_bookings.findMany({ where: dateFilterObj, take: MAX_ROWS_PER_TABLE, select: { id: true, bookingNumber: true, customerName: true, customerPhone: true, createdAt: true, deliveryCity: true } }).catch(() => []),
    prisma.luxury_bookings.findMany({ where: dateFilterObj, take: MAX_ROWS_PER_TABLE, select: { id: true, bookingNumber: true, customerName: true, customerPhone: true, createdAt: true, pickupCity: true } }).catch(() => []),
    prisma.packers_bookings.findMany({ where: dateFilterObj, take: MAX_ROWS_PER_TABLE, select: { id: true, bookingNumber: true, customerName: true, customerPhone: true, createdAt: true, pickupCity: true } }).catch(() => []),
    prisma.truck_bookings.findMany({ where: dateFilterObj, take: MAX_ROWS_PER_TABLE, select: { id: true, bookingNumber: true, customerName: true, customerPhone: true, createdAt: true, pickupCity: true } }).catch(() => []),
  ]);

  return [
    ...bike.map((r: any) => ({ id: r.id, requestNumber: r.bookingNumber, customerName: r.customerName, customerPhone: r.customerPhone, serviceName: 'Bike Rental', serviceSlug: 'bike-rental', locationName: r.locationName, createdAt: r.createdAt })),
    ...bus.map((r: any) => ({ id: r.id, requestNumber: r.bookingNumber, customerName: r.customerName, customerPhone: r.customerPhone, serviceName: 'Bus Rental', serviceSlug: 'bus-rental', locationName: r.pickupCity, createdAt: r.createdAt })),
    ...car.map((r: any) => ({ id: r.id, requestNumber: r.bookingNumber, customerName: r.customerName, customerPhone: r.customerPhone, serviceName: 'Self Drive', serviceSlug: 'self-drive-car-rental', locationName: r.locationName, createdAt: r.createdAt })),
    ...chauffeur.map((r: any) => ({ id: r.id, requestNumber: r.bookingNumber, customerName: r.customerName, customerPhone: r.customerPhone, serviceName: 'Chauffeur / Car Rental', serviceSlug: 'chauffeur-driven-car-rental', locationName: r.locationName, createdAt: r.createdAt })),
    ...equipment.map((r: any) => ({ id: r.id, requestNumber: r.bookingNumber, customerName: r.customerName, customerPhone: r.customerPhone, serviceName: 'Equipment Rental', serviceSlug: 'equipment-rental', locationName: r.deliveryCity, createdAt: r.createdAt })),
    ...luxury.map((r: any) => ({ id: r.id, requestNumber: r.bookingNumber, customerName: r.customerName, customerPhone: r.customerPhone, serviceName: 'Luxury Cars', serviceSlug: 'luxury-car-rental', locationName: r.pickupCity, createdAt: r.createdAt })),
    ...packers.map((r: any) => ({ id: r.id, requestNumber: r.bookingNumber, customerName: r.customerName, customerPhone: r.customerPhone, serviceName: 'Packers & Movers', serviceSlug: 'packers-and-movers', locationName: r.pickupCity, createdAt: r.createdAt })),
    ...truck.map((r: any) => ({ id: r.id, requestNumber: r.bookingNumber, customerName: r.customerName, customerPhone: r.customerPhone, serviceName: 'Truck Transport', serviceSlug: 'truck-transport', locationName: r.pickupCity, createdAt: r.createdAt })),
  ];
}

// "Untouched" = no manager (any manager, not just one) has ever logged an
// action against it — i.e. nobody has picked this up yet, by anyone.
async function splitByActioned(items: TrackedItem[], recordType: 'INQUIRY' | 'BOOKING') {
  if (items.length === 0) return { untouched: [] as TrackedItem[], actionedCount: 0 };
  const ids = items.map((i) => i.id);
  const actioned = await prisma.manager_action_logs.findMany({
    where: { recordType, recordId: { in: ids } },
    select: { recordId: true },
    distinct: ['recordId'],
  }).catch(() => []);
  const actionedSet = new Set(actioned.map((a) => a.recordId));
  return {
    untouched: items.filter((i) => !actionedSet.has(i.id)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    actionedCount: actionedSet.size,
  };
}

// Resolves the Operations Tracker's `location`/`state` query params (ids from
// the filter dropdowns) down to a city name / list of city names — the same
// shape every geo-aware list & breakdown function here filters on. A specific
// location always wins over a state.
export async function resolveGeoFilterParams(searchParams: URLSearchParams): Promise<{ cityName?: string; cityNamesInState?: string[] }> {
  const locationId = searchParams.get('location') || '';
  const stateId = searchParams.get('state') || '';
  if (locationId) {
    const loc = await prisma.locations.findUnique({ where: { id: locationId }, select: { name: true } });
    return loc?.name ? { cityName: loc.name } : {};
  }
  if (stateId) {
    const cities = await prisma.locations.findMany({ where: { parentId: stateId, isActive: true }, select: { name: true } });
    return { cityNamesInState: Array.from(new Set(cities.map((c) => c.name))) };
  }
  return {};
}

// Narrows a tracked-items list to one city (exact) or one state's cities —
// the accurate, dropdown-backed equivalent of the free-text search box.
function filterByGeo(items: TrackedItem[], page: PageParams): TrackedItem[] {
  if (page.cityName) return items.filter((i) => i.locationName === page.cityName);
  if (page.cityNamesInState) return items.filter((i) => page.cityNamesInState!.includes(i.locationName));
  return items;
}

export async function getUntouchedInquiries(dateFilterObj: DateFilterObj, page: PageParams = {}) {
  const geoScoped = filterByGeo(await getAllInquiries(dateFilterObj), page);
  const { untouched, actionedCount } = await splitByActioned(geoScoped, 'INQUIRY');
  const q = page.search?.trim().toLowerCase();
  const filtered = q ? untouched.filter((i) => matchesTrackedItemSearch(i, q)) : untouched;
  const paged = paginate(filtered, page.page, page.limit);
  return { total: geoScoped.length, actioned: actionedCount, untouchedTotal: paged.total, items: paged.items, page: paged.page, limit: paged.limit, totalPages: paged.totalPages };
}

export async function getUntouchedBookings(dateFilterObj: DateFilterObj, page: PageParams = {}) {
  const geoScoped = filterByGeo(await getAllBookings(dateFilterObj), page);
  const { untouched, actionedCount } = await splitByActioned(geoScoped, 'BOOKING');
  const q = page.search?.trim().toLowerCase();
  const filtered = q ? untouched.filter((i) => matchesTrackedItemSearch(i, q)) : untouched;
  const paged = paginate(filtered, page.page, page.limit);
  return { total: geoScoped.length, actioned: actionedCount, untouchedTotal: paged.total, items: paged.items, page: paged.page, limit: paged.limit, totalPages: paged.totalPages };
}

// ── Vendors needing action — stuck in a non-terminal status and nobody has
// touched them (via manager_action_logs) in `staleDays`. ──

const NON_TERMINAL_VENDOR_STATUSES = ['PENDING', 'DOCUMENTS_PENDING', 'UNDER_REVIEW'] as const;

export async function getVendorsNeedingAction(staleDays = 3, page: PageParams = {}) {
  const staleBefore = new Date();
  staleBefore.setDate(staleBefore.getDate() - staleDays);

  const candidates = await prisma.vendors.findMany({
    where: { status: { in: [...NON_TERMINAL_VENDOR_STATUSES] }, updatedAt: { lte: staleBefore } },
    select: { id: true, businessName: true, ownerName: true, phone: true, email: true, city: true, status: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: 'asc' },
    take: MAX_ROWS_PER_TABLE,
  });

  if (candidates.length === 0) return paginate([] as (typeof candidates[number] & { daysSinceUpdate: number })[], page.page, page.limit);

  const recentActions = await prisma.manager_action_logs.findMany({
    where: { recordType: 'VENDOR', recordId: { in: candidates.map((v) => v.id) }, createdAt: { gte: staleBefore } },
    select: { recordId: true },
    distinct: ['recordId'],
  }).catch(() => []);
  const recentlyActionedSet = new Set(recentActions.map((a) => a.recordId));

  let result = candidates
    .filter((v) => !recentlyActionedSet.has(v.id))
    .map((v) => ({ ...v, daysSinceUpdate: Math.floor((Date.now() - v.updatedAt.getTime()) / 86400000) }));

  const q = page.search?.trim().toLowerCase();
  if (q) {
    result = result.filter((v) =>
      v.businessName?.toLowerCase().includes(q) || v.phone?.includes(q) || (v.city || '').toLowerCase().includes(q));
  }

  return paginate(result, page.page, page.limit);
}

// ── Coverage gaps (demand without supply) — admin-wide read of the
// already-real-time vendor_coverage_gaps log (written whenever an inquiry
// comes in with zero eligible vendors), grouped by location + service. ──

export async function getCoverageGaps(dateFilterObj: DateFilterObj, page: PageParams = {}) {
  const rows = await prisma.vendor_coverage_gaps.findMany({
    where: dateFilterObj, take: MAX_ROWS_PER_TABLE,
    orderBy: { createdAt: 'desc' },
  }).catch(() => []);

  const byKey = new Map<string, { locationName: string; serviceType: string; count: number; latest: Date; requestNumbers: string[] }>();
  for (const row of rows) {
    const key = `${row.locationName}::${row.serviceType}`;
    if (!byKey.has(key)) byKey.set(key, { locationName: row.locationName, serviceType: row.serviceType, count: 0, latest: row.createdAt, requestNumbers: [] });
    const entry = byKey.get(key)!;
    entry.count += 1;
    if (row.createdAt > entry.latest) entry.latest = row.createdAt;
    if (entry.requestNumbers.length < 5) entry.requestNumbers.push(row.requestNumber);
  }

  let groups = [...byKey.values()].sort((a, b) => b.count - a.count);
  const q = page.search?.trim().toLowerCase();
  if (q) groups = groups.filter((g) => g.locationName.toLowerCase().includes(q) || g.serviceType.toLowerCase().includes(q));

  const paged = paginate(groups, page.page, page.limit);
  return { total: rows.length, groupsTotal: paged.total, items: paged.items, page: paged.page, limit: paged.limit, totalPages: paged.totalPages };
}

// ── Idle vendors (supply without demand) — location+service combos with an
// active, approved vendor but ~zero inquiry volume in the period. ──

export interface IdleLocationSummary {
  locationName: string;
  total: number;
  serviceCount: number;
  services: { serviceName: string; vendorCount: number }[];
}

interface VendorCoverageEntry { locationName: string; serviceName: string; serviceSlug: string; vendorCount: number }

// Shared by getIdleVendorCoverage (supply side) and getDemandCoverage (demand
// side) — every (location, service) combo with at least one active approved
// vendor, and how many vendors cover it.
async function getVendorCoverageCounts(): Promise<Map<string, VendorCoverageEntry>> {
  const approvedLinks = await prisma.vendor_approved_locations.findMany({
    where: { isActive: true, vendors: { status: 'APPROVED' } },
    select: { vendorId: true, locationId: true, locations: { select: { name: true } } },
  });
  const coverageCount = new Map<string, VendorCoverageEntry>();
  if (approvedLinks.length === 0) return coverageCount;

  const vendorIds = [...new Set(approvedLinks.map((l) => l.vendorId))];
  const serviceLinks = await prisma.vendor_approved_services.findMany({
    where: { vendorId: { in: vendorIds }, isActive: true },
    select: { vendorId: true, services: { select: { id: true, slug: true, name: true } } },
  });
  const servicesByVendor = new Map<string, { slug: string; name: string }[]>();
  for (const link of serviceLinks) {
    if (!link.services) continue;
    if (!servicesByVendor.has(link.vendorId)) servicesByVendor.set(link.vendorId, []);
    servicesByVendor.get(link.vendorId)!.push({ slug: link.services.slug, name: link.services.name });
  }

  for (const link of approvedLinks) {
    const locationName = link.locations?.name;
    if (!locationName) continue;
    for (const service of servicesByVendor.get(link.vendorId) || []) {
      const key = `${locationName}::${service.slug}`;
      if (!coverageCount.has(key)) coverageCount.set(key, { locationName, serviceName: service.name, serviceSlug: service.slug, vendorCount: 0 });
      coverageCount.get(key)!.vendorCount += 1;
    }
  }
  return coverageCount;
}

export async function getIdleVendorCoverage(dateFilterObj: DateFilterObj, page: PageParams = {}) {
  const [coverageCount, inquiries] = await Promise.all([
    getVendorCoverageCounts(),
    getAllInquiries(dateFilterObj),
  ]);

  // Inquiry count per (locationName, serviceSlug) — the only key inquiry
  // tables can consistently be matched on given the string-city fields.
  const inquiryCounts = new Map<string, number>();
  for (const item of inquiries) {
    const key = `${item.locationName}::${item.serviceSlug}`;
    inquiryCounts.set(key, (inquiryCounts.get(key) || 0) + 1);
  }

  let idle: { locationName: string; serviceName: string; vendorCount: number }[] = [];
  for (const [key, entry] of coverageCount.entries()) {
    if (!inquiryCounts.has(key) || inquiryCounts.get(key) === 0) idle.push({ locationName: entry.locationName, serviceName: entry.serviceName, vendorCount: entry.vendorCount });
  }
  idle.sort((a, b) => b.vendorCount - a.vendorCount);

  const q = page.search?.trim().toLowerCase();
  if (q) idle = idle.filter((row) => row.locationName.toLowerCase().includes(q) || row.serviceName.toLowerCase().includes(q));

  // Per-location roll-up for the chart — the row-level list is almost always
  // dominated by ties (every service at a location tends to have the same
  // small number of approved vendors), which makes a per-row bar chart look
  // flat and uninformative. Summing across services per location produces
  // real variation (a location idle across 5 services outranks one idle
  // across 2) and is what "which city needs demand-generation focus" is
  // actually asking. Built from the same (searched) `idle` rows.
  const byLocationMap = new Map<string, IdleLocationSummary>();
  for (const row of idle) {
    if (!byLocationMap.has(row.locationName)) byLocationMap.set(row.locationName, { locationName: row.locationName, total: 0, serviceCount: 0, services: [] });
    const entry = byLocationMap.get(row.locationName)!;
    entry.total += row.vendorCount;
    entry.serviceCount += 1;
    entry.services.push({ serviceName: row.serviceName, vendorCount: row.vendorCount });
  }
  const byLocation = [...byLocationMap.values()].sort((a, b) => b.total - a.total).slice(0, 8);

  return { ...paginate(idle, page.page, page.limit), byLocation };
}

// ── Demand coverage (the flip side of idle vendor coverage) — every
// (location, service) combo that actually got inquiries in the period, with
// how many approved vendors were there to serve it. Unlike the
// vendor_coverage_gaps log (which only fires for the true zero-vendor case
// at inquiry time), this is computed live so it supports an arbitrary
// "vendorCount <= N" threshold — e.g. "show me demand sitting on fewer than
// 5 vendors", not just the binary zero case. ──

export interface DemandCoverageItem {
  locationName: string;
  serviceName: string;
  serviceSlug: string;
  inquiryCount: number;
  vendorCount: number;
}

export async function getDemandCoverage(dateFilterObj: DateFilterObj, page: PageParams & { maxVendors?: number } = {}) {
  const [coverageCount, inquiries] = await Promise.all([
    getVendorCoverageCounts(),
    getAllInquiries(dateFilterObj),
  ]);

  const byKey = new Map<string, DemandCoverageItem>();
  for (const item of inquiries) {
    const key = `${item.locationName}::${item.serviceSlug}`;
    if (!byKey.has(key)) {
      const coverage = coverageCount.get(key);
      byKey.set(key, {
        locationName: item.locationName,
        serviceName: coverage?.serviceName || item.serviceName,
        serviceSlug: item.serviceSlug,
        inquiryCount: 0,
        vendorCount: coverage?.vendorCount ?? 0,
      });
    }
    byKey.get(key)!.inquiryCount += 1;
  }

  let results = [...byKey.values()];
  if (page.maxVendors !== undefined) results = results.filter((r) => r.vendorCount <= page.maxVendors!);

  // Worst first: least covered demand, then highest volume within that.
  results.sort((a, b) => a.vendorCount - b.vendorCount || b.inquiryCount - a.inquiryCount);

  const q = page.search?.trim().toLowerCase();
  if (q) results = results.filter((r) => r.locationName.toLowerCase().includes(q) || r.serviceName.toLowerCase().includes(q));

  return paginate(results, page.page, page.limit);
}

// ── Payment failures (System Health) — bookings stuck at paymentStatus
// FAILED across all 8 service tables. This is real, already-persisted data:
// each service's payment verify route writes FAILED on a genuine gateway
// failure, so unlike notification/cron health (no history persisted
// anywhere yet) this can be reported today without adding new logging. ──

export interface PaymentFailureItem {
  id: string;
  requestNumber: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  serviceSlug: string;
  locationName: string;
  amount: number;
  paymentMethod: string | null;
  createdAt: Date;
}

export async function getPaymentFailures(dateFilterObj: DateFilterObj, page: PageParams = {}): Promise<PaginatedResult<PaymentFailureItem>> {
  const failedWhere = { ...dateFilterObj, paymentStatus: 'FAILED' as const };
  const [bike, bus, car, chauffeur, equipment, luxury, packers, truck] = await Promise.all([
    prisma.bike_bookings.findMany({ where: failedWhere, take: MAX_ROWS_PER_TABLE, select: { id: true, bookingNumber: true, customerName: true, customerPhone: true, createdAt: true, locationName: true, grandTotal: true, paymentMethod: true } }).catch(() => []),
    prisma.bus_bookings.findMany({ where: failedWhere, take: MAX_ROWS_PER_TABLE, select: { id: true, bookingNumber: true, customerName: true, customerPhone: true, createdAt: true, pickupCity: true, totalAmount: true, paymentMethod: true } }).catch(() => []),
    prisma.car_bookings.findMany({ where: failedWhere, take: MAX_ROWS_PER_TABLE, select: { id: true, bookingNumber: true, customerName: true, customerPhone: true, createdAt: true, locationName: true, grandTotal: true, paymentMethod: true } }).catch(() => []),
    prisma.chauffeur_bookings.findMany({ where: failedWhere, take: MAX_ROWS_PER_TABLE, select: { id: true, bookingNumber: true, customerName: true, customerPhone: true, createdAt: true, locationName: true, grandTotal: true, paymentMethod: true } }).catch(() => []),
    prisma.equipment_bookings.findMany({ where: failedWhere, take: MAX_ROWS_PER_TABLE, select: { id: true, bookingNumber: true, customerName: true, customerPhone: true, createdAt: true, deliveryCity: true, totalAmount: true, paymentMethod: true } }).catch(() => []),
    prisma.luxury_bookings.findMany({ where: failedWhere, take: MAX_ROWS_PER_TABLE, select: { id: true, bookingNumber: true, customerName: true, customerPhone: true, createdAt: true, pickupCity: true, grandTotal: true, paymentMethod: true } }).catch(() => []),
    prisma.packers_bookings.findMany({ where: failedWhere, take: MAX_ROWS_PER_TABLE, select: { id: true, bookingNumber: true, customerName: true, customerPhone: true, createdAt: true, pickupCity: true, totalAmount: true, paymentMethod: true } }).catch(() => []),
    prisma.truck_bookings.findMany({ where: failedWhere, take: MAX_ROWS_PER_TABLE, select: { id: true, bookingNumber: true, customerName: true, customerPhone: true, createdAt: true, pickupCity: true, totalAmount: true, paymentMethod: true } }).catch(() => []),
  ]);

  let items: PaymentFailureItem[] = [
    ...bike.map((r: any) => ({ id: r.id, requestNumber: r.bookingNumber, customerName: r.customerName, customerPhone: r.customerPhone, serviceName: 'Bike Rental', serviceSlug: 'bike-rental', locationName: r.locationName, amount: r.grandTotal, paymentMethod: r.paymentMethod, createdAt: r.createdAt })),
    ...bus.map((r: any) => ({ id: r.id, requestNumber: r.bookingNumber, customerName: r.customerName, customerPhone: r.customerPhone, serviceName: 'Bus Rental', serviceSlug: 'bus-rental', locationName: r.pickupCity, amount: r.totalAmount, paymentMethod: r.paymentMethod, createdAt: r.createdAt })),
    ...car.map((r: any) => ({ id: r.id, requestNumber: r.bookingNumber, customerName: r.customerName, customerPhone: r.customerPhone, serviceName: 'Self Drive', serviceSlug: 'self-drive-car-rental', locationName: r.locationName, amount: r.grandTotal, paymentMethod: r.paymentMethod, createdAt: r.createdAt })),
    ...chauffeur.map((r: any) => ({ id: r.id, requestNumber: r.bookingNumber, customerName: r.customerName, customerPhone: r.customerPhone, serviceName: 'Chauffeur / Car Rental', serviceSlug: 'chauffeur-driven-car-rental', locationName: r.locationName, amount: r.grandTotal, paymentMethod: r.paymentMethod, createdAt: r.createdAt })),
    ...equipment.map((r: any) => ({ id: r.id, requestNumber: r.bookingNumber, customerName: r.customerName, customerPhone: r.customerPhone, serviceName: 'Equipment Rental', serviceSlug: 'equipment-rental', locationName: r.deliveryCity, amount: r.totalAmount, paymentMethod: r.paymentMethod, createdAt: r.createdAt })),
    ...luxury.map((r: any) => ({ id: r.id, requestNumber: r.bookingNumber, customerName: r.customerName, customerPhone: r.customerPhone, serviceName: 'Luxury Cars', serviceSlug: 'luxury-car-rental', locationName: r.pickupCity, amount: r.grandTotal, paymentMethod: r.paymentMethod, createdAt: r.createdAt })),
    ...packers.map((r: any) => ({ id: r.id, requestNumber: r.bookingNumber, customerName: r.customerName, customerPhone: r.customerPhone, serviceName: 'Packers & Movers', serviceSlug: 'packers-and-movers', locationName: r.pickupCity, amount: r.totalAmount, paymentMethod: r.paymentMethod, createdAt: r.createdAt })),
    ...truck.map((r: any) => ({ id: r.id, requestNumber: r.bookingNumber, customerName: r.customerName, customerPhone: r.customerPhone, serviceName: 'Truck Transport', serviceSlug: 'truck-transport', locationName: r.pickupCity, amount: r.totalAmount, paymentMethod: r.paymentMethod, createdAt: r.createdAt })),
  ];

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const q = page.search?.trim().toLowerCase();
  if (q) {
    items = items.filter((i) =>
      i.customerName?.toLowerCase().includes(q) || i.customerPhone?.includes(q) ||
      i.locationName?.toLowerCase().includes(q) || i.requestNumber?.toLowerCase().includes(q));
  }

  return paginate(items, page.page, page.limit);
}

// ── System Health (cron jobs + notification sends) — reads the
// system_event_logs run-history table (src/lib/system-health/log-event.ts
// writes it from each cron route and FCM send site). A source with zero
// rows in the window means it hasn't run/fired yet, not that it's healthy —
// the UI must say so rather than implying "0 failures = all good". ──

export interface CronJobHealth {
  sourceName: string;
  lastStatus: 'SUCCESS' | 'FAILURE' | null;
  lastRunAt: Date | null;
  lastMessage: string | null;
  lastDurationMs: number | null;
  runsLast7d: number;
  failuresLast7d: number;
}

export interface NotificationHealth {
  sourceName: string;
  successLast7d: number;
  failureLast7d: number;
}

// Every cron route currently wired to logSystemEvent() — kept as an explicit
// list (rather than "whatever shows up in the logs") so a job that has never
// fired even once still shows up as "never run" instead of silently missing.
const KNOWN_CRON_SOURCES = ['auto-drop-bookings', 'seo-content-refresh', 'expire-web-stories'];

type SystemEventLogRow = Awaited<ReturnType<typeof prisma.system_event_logs.findMany>>[number];

export async function getSystemHealth(): Promise<{ cronJobs: CronJobHealth[]; notifications: NotificationHealth[] }> {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recent = await prisma.system_event_logs.findMany({
    where: { createdAt: { gte: since7d } },
    orderBy: { createdAt: 'desc' },
    take: MAX_ROWS_PER_TABLE,
  }).catch(() => [] as SystemEventLogRow[]);

  const cronBySource = new Map<string, SystemEventLogRow[]>();
  const notifBySource = new Map<string, SystemEventLogRow[]>();
  for (const row of recent) {
    const bucket = row.category === 'CRON' ? cronBySource : notifBySource;
    if (!bucket.has(row.sourceName)) bucket.set(row.sourceName, []);
    bucket.get(row.sourceName)!.push(row);
  }

  const cronSources = new Set([...KNOWN_CRON_SOURCES, ...cronBySource.keys()]);
  const cronJobs: CronJobHealth[] = [...cronSources].map((sourceName) => {
    const runs = cronBySource.get(sourceName) || []; // already sorted desc by createdAt
    const latest = runs[0];
    return {
      sourceName,
      lastStatus: latest?.status ?? null,
      lastRunAt: latest?.createdAt ?? null,
      lastMessage: latest?.message ?? null,
      lastDurationMs: latest?.durationMs ?? null,
      runsLast7d: runs.length,
      failuresLast7d: runs.filter((r) => r.status === 'FAILURE').length,
    };
  }).sort((a, b) => (b.lastRunAt?.getTime() ?? 0) - (a.lastRunAt?.getTime() ?? 0));

  const notifications: NotificationHealth[] = [...notifBySource.entries()].map(([sourceName, runs]) => ({
    sourceName,
    successLast7d: runs.filter((r) => r.status === 'SUCCESS').length,
    failureLast7d: runs.filter((r) => r.status === 'FAILURE').length,
  })).sort((a, b) => b.failureLast7d - a.failureLast7d);

  return { cronJobs, notifications };
}
