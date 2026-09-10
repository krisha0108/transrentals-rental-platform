import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// The manager's combined inquiry feed spans 7 unrelated quote-request tables
// with no shared parent — there's no single table Prisma can paginate for us.
// Fetching every matching row per table and slicing the combined array in JS
// (the old approach, capped at MAX_ROWS_PER_TABLE=3000/table) is what caused
// the live 500s on deep pages: it does the same full scan + in-memory sort on
// every request no matter which 10-20 rows are actually being asked for.
//
// This does it the other way around: a raw SQL UNION ALL across the 7 tables
// selects only (service key, id, status, createdAt) with every filter pushed
// into each branch's own WHERE (so each table's indexes do the filtering),
// then ORDER BY + LIMIT/OFFSET happens once on that lightweight union to get
// exactly this page's ids — never more than `limit` rows fetched in full.
// Those ids are then hydrated with their real per-service fields in a second,
// narrowly-scoped step below.
interface ServiceDef {
  key: string;
  table: string;
  serviceSlug: string;
  serviceName: string;
  matchSlugs: string[];
  locationFilterCol: 'locationId' | 'pickupCity' | 'deliveryCity';
  locationValueType: 'id' | 'name';
  displayLocationCol: string;
}

const SERVICE_DEFS: ServiceDef[] = [
  { key: 'bike', table: 'bike_quote_requests', serviceSlug: 'bike-rental', serviceName: 'Bike Rental', matchSlugs: ['bike-rental', 'bike', 'bike-rental-activa', 'bike-on-rent'], locationFilterCol: 'locationId', locationValueType: 'id', displayLocationCol: 'locationName' },
  { key: 'bus', table: 'bus_quote_requests', serviceSlug: 'bus-rental', serviceName: 'Bus Rental', matchSlugs: ['bus-rental', 'bus'], locationFilterCol: 'pickupCity', locationValueType: 'name', displayLocationCol: 'pickupCity' },
  { key: 'selfDrive', table: 'self_drive_quote_requests', serviceSlug: 'self-drive', serviceName: 'Self Drive', matchSlugs: ['self-drive-car-rentals', 'self-drive-car-rental', 'self-drive'], locationFilterCol: 'locationId', locationValueType: 'id', displayLocationCol: 'locationName' },
  { key: 'equipment', table: 'equipment_quote_requests', serviceSlug: 'equipment-rental', serviceName: 'Equipment Rental', matchSlugs: ['equipment-rental', 'equipment'], locationFilterCol: 'deliveryCity', locationValueType: 'name', displayLocationCol: 'deliveryCity' },
  { key: 'luxury', table: 'luxury_quote_requests', serviceSlug: 'luxury-car-rental', serviceName: 'Luxury Cars', matchSlugs: ['luxury-car-rental', 'luxury'], locationFilterCol: 'pickupCity', locationValueType: 'name', displayLocationCol: 'pickupCity' },
  { key: 'packers', table: 'packers_quote_requests', serviceSlug: 'packers-and-movers', serviceName: 'Packers & Movers', matchSlugs: ['packers-and-movers', 'packers-movers'], locationFilterCol: 'pickupCity', locationValueType: 'name', displayLocationCol: 'pickupCity' },
  { key: 'truck', table: 'truck_quote_requests', serviceSlug: 'truck-transport', serviceName: 'Truck Transport', matchSlugs: ['truck-transport', 'truck', 'transporter', 'truck-rental', 'truck-tempo-rental', 'mini-truck-rental', 'trailer-on-rent'], locationFilterCol: 'pickupCity', locationValueType: 'name', displayLocationCol: 'pickupCity' },
];

const ident = (name: string) => Prisma.raw(`\`${name}\``);
// `def.key` is always one of our own SERVICE_DEFS constants, never request
// input — safe to inline as a raw literal. Binding it as a normal parameter
// instead makes mysql2 come back with a Buffer instead of a string (no
// column metadata to infer VARCHAR from), which silently breaks the
// idsByService grouping keyed on this value below.
const lit = (s: string) => Prisma.raw(`'${s}'`);

interface UnionRow {
  svcKey: string;
  id: string;
  status: string;
  createdAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: {
        manager_locations: { include: { locations: true } },
        manager_services: { include: { services: true } },
      },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);
    const assignedLocationNames = manager.manager_locations.map((ml) => ml.locations.name);
    const assignedServiceSlugs = manager.manager_services.map((ms) => ms.services.slug);

    const uniqueServices = SERVICE_DEFS.filter((def) =>
      assignedServiceSlugs.some((slug) => def.matchSlugs.includes(slug))
    ).map((def, index) => ({ id: `service-${index}`, name: def.serviceName, slug: def.serviceSlug }));

    const emptyResponse = (page: number, limit: number) => ({
      success: true,
      inquiries: [],
      services: uniqueServices,
      locations: [],
      stats: { total: 0, pending: 0, quotesReceived: 0, quoteAccepted: 0, cancelled: 0 },
      pagination: { page, limit, total: 0, totalPages: 1 },
    });

    if (assignedLocationIds.length === 0 || assignedServiceSlugs.length === 0) {
      return NextResponse.json(emptyResponse(1, 10));
    }

    const { searchParams } = new URL(request.url);
    const serviceFilter = searchParams.get('service') || 'all';
    const statusFilter = searchParams.get('status') || 'all';
    const sourceFilter = searchParams.get('source') || 'all';
    const locationFilter = searchParams.get('location') || 'all';
    const dateFilter = searchParams.get('date') || 'all';
    const actionedFilter = searchParams.get('actioned') || 'all';
    const search = (searchParams.get('search') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '20', 10));

    // Services this manager is assigned to AND that pass the service filter —
    // only these tables get a branch in the union at all.
    const activeDefs = SERVICE_DEFS.filter((def) => {
      const assigned = assignedServiceSlugs.some((slug) => def.matchSlugs.includes(slug));
      if (!assigned) return false;
      return serviceFilter === 'all' || def.matchSlugs.includes(serviceFilter);
    });

    if (activeDefs.length === 0) {
      return NextResponse.json(emptyResponse(page, limit));
    }

    // Date-bucket boundaries — same logic the page used to run client-side.
    let dateFrom: Date | null = null;
    let dateTo: Date | null = null;
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (dateFilter === 'today') {
        dateFrom = today;
      } else if (dateFilter === 'yesterday') {
        dateFrom = new Date(today);
        dateFrom.setDate(dateFrom.getDate() - 1);
        dateTo = today;
      } else if (dateFilter === 'thisMonth') {
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (dateFilter === 'lastMonth') {
        dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        dateTo = new Date(now.getFullYear(), now.getMonth(), 1);
      }
    }

    // MySQL's default LIKE escape char is backslash — escape any literal
    // backslash/%/_ in the user's search text so it can't be read as a wildcard.
    const likeEscape = (s: string) => s.replace(/[\\%_]/g, '\\$&');
    const searchLike = search ? `%${likeEscape(search)}%` : null;

    // One SELECT per active, in-scope service — filters pushed down so each
    // table's own indexes (location/status) do the narrowing.
    const buildBranch = (def: ServiceDef, withFilters: boolean): Prisma.Sql | null => {
      const locationValues = def.locationValueType === 'id' ? assignedLocationIds : assignedLocationNames;
      if (locationValues.length === 0) return null;

      const conditions: Prisma.Sql[] = [
        Prisma.sql`${ident(def.locationFilterCol)} IN (${Prisma.join(locationValues)})`,
      ];

      if (withFilters) {
        if (statusFilter !== 'all') conditions.push(Prisma.sql`status = ${statusFilter}`);
        if (sourceFilter !== 'all') conditions.push(Prisma.sql`COALESCE(source, 'web') = ${sourceFilter}`);
        if (locationFilter !== 'all') conditions.push(Prisma.sql`${ident(def.displayLocationCol)} = ${locationFilter}`);
        if (dateFrom) conditions.push(Prisma.sql`createdAt >= ${dateFrom}`);
        if (dateTo) conditions.push(Prisma.sql`createdAt < ${dateTo}`);
        if (searchLike) {
          // A search term matching this service's own name pulls in every
          // row from this branch — same semantics as the old client-side
          // filter treating "serviceName" as one of the searchable fields.
          const nameMatches = def.serviceName.toLowerCase().includes(search.toLowerCase());
          conditions.push(Prisma.sql`(
            requestNumber LIKE ${searchLike}
            OR customerName LIKE ${searchLike}
            OR customerPhone LIKE ${searchLike}
            OR customerEmail LIKE ${searchLike}
            OR ${ident(def.displayLocationCol)} LIKE ${searchLike}
            ${nameMatches ? Prisma.sql`OR TRUE` : Prisma.empty}
          )`);
        }
      }

      return Prisma.sql`
        SELECT ${lit(def.key)} AS svcKey, id, status, createdAt
        FROM ${ident(def.table)}
        WHERE ${Prisma.join(conditions, ' AND ')}
      `;
    };

    const filteredBranches = activeDefs.map((def) => buildBranch(def, true)).filter((b): b is Prisma.Sql => b !== null);

    if (filteredBranches.length === 0) {
      return NextResponse.json(emptyResponse(page, limit));
    }

    const unionSql = Prisma.join(filteredBranches, ' UNION ALL ');

    const actionedJoin =
      actionedFilter === 'actioned'
        ? Prisma.sql`WHERE EXISTS (SELECT 1 FROM manager_action_logs mal WHERE mal.recordType = 'INQUIRY' AND mal.recordId = t.id)`
        : actionedFilter === 'notActioned'
        ? Prisma.sql`WHERE NOT EXISTS (SELECT 1 FROM manager_action_logs mal WHERE mal.recordType = 'INQUIRY' AND mal.recordId = t.id)`
        : Prisma.empty;

    const [pageRows, countRows, statsRows] = await Promise.all([
      prisma.$queryRaw<UnionRow[]>(Prisma.sql`
        SELECT t.* FROM (${unionSql}) t
        ${actionedJoin}
        ORDER BY t.createdAt DESC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `),
      prisma.$queryRaw<{ cnt: bigint }[]>(Prisma.sql`
        SELECT COUNT(*) AS cnt FROM (${unionSql}) t
        ${actionedJoin}
      `),
      prisma.$queryRaw<{ status: string; cnt: bigint }[]>(Prisma.sql`
        SELECT t.status AS status, COUNT(*) AS cnt FROM (${unionSql}) t
        ${actionedJoin}
        GROUP BY t.status
      `),
    ]);

    const total = Number(countRows[0]?.cnt || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const statsByStatus: Record<string, number> = {};
    for (const row of statsRows) statsByStatus[row.status] = Number(row.cnt);
    const stats = {
      total,
      pending: statsByStatus.PENDING || 0,
      quotesReceived: statsByStatus.QUOTES_RECEIVED || 0,
      quoteAccepted: statsByStatus.QUOTE_ACCEPTED || 0,
      cancelled: statsByStatus.CANCELLED || 0,
    };

    // Distinct location values for the filter dropdown — scoped to the
    // manager's assigned locations/services and the current service filter
    // only (not status/date/etc.), so the dropdown doesn't shrink as other
    // filters narrow the results — matches the page's prior behavior.
    const distinctLocationBranches = activeDefs
      .map((def) => {
        const locationValues = def.locationValueType === 'id' ? assignedLocationIds : assignedLocationNames;
        if (locationValues.length === 0) return null;
        return Prisma.sql`
          SELECT ${ident(def.displayLocationCol)} AS locName
          FROM ${ident(def.table)}
          WHERE ${ident(def.locationFilterCol)} IN (${Prisma.join(locationValues)})
        `;
      })
      .filter((b): b is Prisma.Sql => b !== null);

    const locationRows =
      distinctLocationBranches.length > 0
        ? await prisma.$queryRaw<{ locName: string | null }[]>(Prisma.sql`
            SELECT DISTINCT locName FROM (${Prisma.join(distinctLocationBranches, ' UNION ALL ')}) t
            WHERE locName IS NOT NULL
            ORDER BY locName
          `)
        : [];
    const uniqueLocations = locationRows.map((r) => r.locName).filter((v): v is string => !!v);

    if (pageRows.length === 0) {
      return NextResponse.json({
        success: true,
        inquiries: [],
        services: uniqueServices,
        locations: uniqueLocations,
        stats,
        pagination: { page, limit, total, totalPages },
      });
    }

    // Hydrate only this page's ~`limit` rows with their real per-service
    // fields — grouped by which table each id came from.
    const idsByService: Record<string, string[]> = {};
    for (const row of pageRows) {
      (idsByService[row.svcKey] ||= []).push(row.id);
    }

    const [bikeRows, busRows, selfDriveRows, equipmentRows, luxuryRows, packersRows, truckRows] = await Promise.all([
      idsByService.bike?.length
        ? prisma.bike_quote_requests.findMany({
            where: { id: { in: idsByService.bike } },
            include: {
              customers: { select: { id: true, name: true, email: true, phone: true } },
              locations: { select: { id: true, name: true } },
              _count: { select: { bike_quotes_bike_quotes_requestIdTobike_quote_requests: true } },
            },
          })
        : Promise.resolve([]),
      idsByService.bus?.length
        ? prisma.bus_quote_requests.findMany({
            where: { id: { in: idsByService.bus } },
            include: {
              customers: { select: { id: true, name: true, email: true, phone: true } },
              _count: { select: { bus_quotes_bus_quotes_requestIdTobus_quote_requests: true } },
            },
          })
        : Promise.resolve([]),
      idsByService.selfDrive?.length
        ? prisma.self_drive_quote_requests.findMany({
            where: { id: { in: idsByService.selfDrive } },
            include: {
              customers: { select: { id: true, name: true, email: true, phone: true } },
              locations: { select: { id: true, name: true } },
              _count: { select: { self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: true } },
            },
          })
        : Promise.resolve([]),
      idsByService.equipment?.length
        ? prisma.equipment_quote_requests.findMany({
            where: { id: { in: idsByService.equipment } },
            include: {
              customers: { select: { id: true, name: true, email: true, phone: true } },
              _count: { select: { equipment_quotes: true } },
            },
          })
        : Promise.resolve([]),
      idsByService.luxury?.length
        ? prisma.luxury_quote_requests.findMany({
            where: { id: { in: idsByService.luxury } },
            include: {
              customers: { select: { id: true, name: true, email: true, phone: true } },
              _count: { select: { luxury_quotes: true } },
            },
          })
        : Promise.resolve([]),
      idsByService.packers?.length
        ? prisma.packers_quote_requests.findMany({
            where: { id: { in: idsByService.packers } },
            include: {
              customers: { select: { id: true, name: true, email: true, phone: true } },
              _count: { select: { packers_quotes: true } },
            },
          })
        : Promise.resolve([]),
      idsByService.truck?.length
        ? prisma.truck_quote_requests.findMany({
            where: { id: { in: idsByService.truck } },
            include: {
              customers: { select: { id: true, name: true, email: true, phone: true } },
              _count: { select: { truck_quotes: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    const byId = new Map<string, any>();
    for (const q of bikeRows as any[]) {
      byId.set(q.id, {
        id: q.id,
        requestNumber: q.requestNumber,
        status: q.status,
        serviceName: 'Bike Rental',
        serviceSlug: 'bike-rental',
        customerName: q.customers?.name || q.customerName,
        customerPhone: q.customers?.phone || q.customerPhone,
        customerEmail: q.customers?.email || q.customerEmail,
        locationName: q.locations?.name || q.locationName,
        pickupDate: q.pickupDate,
        pickupTime: q.pickupTime,
        dropDate: q.dropDate,
        quotesCount: q._count?.bike_quotes_bike_quotes_requestIdTobike_quote_requests || 0,
        source: q.source || 'web',
        createdAt: q.createdAt,
      });
    }
    for (const q of busRows as any[]) {
      byId.set(q.id, {
        id: q.id,
        requestNumber: q.requestNumber,
        status: q.status,
        serviceName: 'Bus Rental',
        serviceSlug: 'bus-rental',
        customerName: q.customers?.name || q.customerName,
        customerPhone: q.customers?.phone || q.customerPhone,
        customerEmail: q.customers?.email || q.customerEmail,
        locationName: q.pickupCity,
        pickupDate: q.pickupDate,
        pickupTime: q.pickupTime,
        dropDate: q.returnDate,
        quotesCount: q._count?.bus_quotes_bus_quotes_requestIdTobus_quote_requests || 0,
        source: q.source || 'web',
        createdAt: q.createdAt,
      });
    }
    for (const q of selfDriveRows as any[]) {
      byId.set(q.id, {
        id: q.id,
        requestNumber: q.requestNumber,
        status: q.status,
        serviceName: 'Self Drive',
        serviceSlug: 'self-drive',
        customerName: q.customers?.name || q.customerName,
        customerPhone: q.customers?.phone || q.customerPhone,
        customerEmail: q.customers?.email || q.customerEmail,
        locationName: q.locations?.name || q.locationName,
        pickupDate: q.pickupDate,
        pickupTime: q.pickupTime,
        dropDate: q.dropDate,
        quotesCount: q._count?.self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests || 0,
        source: q.source || 'web',
        createdAt: q.createdAt,
      });
    }
    for (const q of equipmentRows as any[]) {
      byId.set(q.id, {
        id: q.id,
        requestNumber: q.requestNumber,
        status: q.status,
        serviceName: 'Equipment Rental',
        serviceSlug: 'equipment-rental',
        customerName: q.customers?.name || q.customerName,
        customerPhone: q.customers?.phone || q.customerPhone,
        customerEmail: q.customers?.email || q.customerEmail,
        // equipment_quote_requests has no `locationName` column — the old
        // code read it anyway and always got undefined, so equipment rows
        // silently dropped out of every location-filtered view.
        locationName: q.deliveryCity,
        pickupDate: q.startDate,
        pickupTime: null,
        dropDate: q.endDate,
        quotesCount: q._count?.equipment_quotes || 0,
        source: q.source || 'web',
        createdAt: q.createdAt,
      });
    }
    for (const q of luxuryRows as any[]) {
      byId.set(q.id, {
        id: q.id,
        requestNumber: q.requestNumber,
        status: q.status,
        serviceName: 'Luxury Cars',
        serviceSlug: 'luxury-car-rental',
        customerName: q.customers?.name || q.customerName,
        customerPhone: q.customers?.phone || q.customerPhone,
        customerEmail: q.customers?.email || q.customerEmail,
        locationName: q.pickupCity,
        pickupDate: q.pickupDate,
        pickupTime: q.pickupTime,
        // luxury_quote_requests has `returnDate`, not `dropDate`.
        dropDate: q.returnDate,
        quotesCount: q._count?.luxury_quotes || 0,
        source: q.source || 'web',
        createdAt: q.createdAt,
      });
    }
    for (const q of packersRows as any[]) {
      byId.set(q.id, {
        id: q.id,
        requestNumber: q.requestNumber,
        status: q.status,
        serviceName: 'Packers & Movers',
        serviceSlug: 'packers-and-movers',
        customerName: q.customers?.name || q.customerName,
        customerPhone: q.customers?.phone || q.customerPhone,
        customerEmail: q.customers?.email || q.customerEmail,
        // packers_quote_requests has `pickupCity`, not `locationName`.
        locationName: q.pickupCity,
        // ...and `preferredDate`, not `moveDate`.
        pickupDate: q.preferredDate,
        pickupTime: null,
        dropDate: null,
        quotesCount: q._count?.packers_quotes || 0,
        source: q.source || 'web',
        createdAt: q.createdAt,
      });
    }
    for (const q of truckRows as any[]) {
      byId.set(q.id, {
        id: q.id,
        requestNumber: q.requestNumber,
        status: q.status,
        serviceName: 'Truck Transport',
        serviceSlug: 'truck-transport',
        customerName: q.customers?.name || q.customerName,
        customerPhone: q.customers?.phone || q.customerPhone,
        customerEmail: q.customers?.email || q.customerEmail,
        locationName: q.pickupCity,
        pickupDate: q.pickupDate,
        pickupTime: q.pickupTime,
        dropDate: null,
        quotesCount: q._count?.truck_quotes || 0,
        source: q.source || 'web',
        createdAt: q.createdAt,
      });
    }

    // Call/action counts scoped to just this page's ids (previously computed
    // across the entire up-to-21000-row superset on every request).
    const pageIds = pageRows.map((r) => r.id);
    const [callCountRows, actionCountRows, actionLogRows] = await Promise.all([
      prisma.vendor_call_logs.groupBy({
        by: ['bookingId'],
        where: { bookingId: { in: pageIds } },
        _count: { bookingId: true },
      }).catch(() => []),
      prisma.manager_action_logs.groupBy({
        by: ['recordId'],
        where: { recordType: 'INQUIRY', recordId: { in: pageIds } },
        _count: { recordId: true },
      }).catch(() => []),
      prisma.manager_action_logs.findMany({
        where: { recordType: 'INQUIRY', recordId: { in: pageIds } },
        select: { recordId: true, actionType: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),
    ]);

    const callCountMap: Record<string, number> = {};
    for (const row of callCountRows) callCountMap[row.bookingId] = row._count.bookingId;
    const actionCountMap: Record<string, number> = {};
    for (const row of actionCountRows) actionCountMap[row.recordId] = row._count.recordId;
    const lastActionMap: Record<string, string> = {};
    for (const row of actionLogRows) {
      if (!lastActionMap[row.recordId]) lastActionMap[row.recordId] = row.actionType;
    }

    // Reassemble in the union's globally-sorted order (createdAt desc across
    // all services), not per-service fetch order.
    const inquiries = pageIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((inquiry) => ({
        ...inquiry,
        callsCount: callCountMap[inquiry.id] || 0,
        actionsCount: actionCountMap[inquiry.id] || 0,
        lastActionType: lastActionMap[inquiry.id] || null,
      }));

    return NextResponse.json({
      success: true,
      inquiries,
      services: uniqueServices,
      locations: uniqueLocations,
      stats,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error: any) {
    logger.error('Manager inquiries error', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiries', details: error?.message },
      { status: 500 }
    );
  }
}
