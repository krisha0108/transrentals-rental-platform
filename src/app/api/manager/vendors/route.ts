import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get vendors for manager's assigned locations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user and verify they are a manager
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

    // const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);

    // Get query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const locationFilter = searchParams.get('location') || 'all';
    const serviceFilter = searchParams.get('service') || 'all';
    const tagFilter = searchParams.get('tag') || 'all';
    const requestFilter = searchParams.get('request') || 'all';
    const joinedFilter = searchParams.get('joined') || 'all';
    const customFrom = searchParams.get('from') || '';
    const customTo = searchParams.get('to') || '';
    const sortBy = searchParams.get('sort') || 'date_desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '20', 10));

    // TEMPORARY: Show ALL vendors to manager (location/service filter commented out)
    // To restore original filter, uncomment the block below and remove the current whereClause
    const whereClause: any = {};
    const andConditions: any[] = [];

    // ORIGINAL location-based filter (commented out temporarily):
    // const whereClause: any = {
    //   OR: [
    //     // Vendors with approved locations
    //     {
    //       vendor_approved_locations: {
    //         some: {
    //           locationId: { in: assignedLocationIds },
    //         },
    //       },
    //     },
    //     // Vendors with pending/requested locations
    //     {
    //       vendor_location_requests: {
    //         some: {
    //           locationId: { in: assignedLocationIds },
    //         },
    //       },
    //     },
    //   ],
    // };

    if (status !== 'all') {
      if (status === 'PENDING') {
        // Include all pending-type statuses
        whereClause.status = { in: ['PENDING', 'DOCUMENTS_PENDING', 'UNDER_REVIEW'] };
      } else {
        whereClause.status = status;
      }
    }

    if (search) {
      andConditions.push({
        OR: [
          { businessName: { contains: search } },
          { ownerName: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { vid: { contains: search } },
        ],
      });
    }

    if (locationFilter !== 'all') {
      andConditions.push({ vendor_approved_locations: { some: { locations: { name: locationFilter } } } });
    }

    if (serviceFilter !== 'all') {
      andConditions.push({ vendor_approved_services: { some: { services: { name: serviceFilter } } } });
    }

    if (requestFilter !== 'all') {
      if (requestFilter === 'location') {
        andConditions.push({ vendor_location_requests: { some: { status: 'PENDING' } } });
      } else if (requestFilter === 'service') {
        andConditions.push({ vendor_service_requests: { some: { status: 'PENDING' } } });
      } else if (requestFilter === 'any') {
        andConditions.push({
          OR: [
            { vendor_location_requests: { some: { status: 'PENDING' } } },
            { vendor_service_requests: { some: { status: 'PENDING' } } },
          ],
        });
      }
    }

    // Joined-date preset — same buckets the page used to compute client-side.
    if (joinedFilter !== 'all' && !(joinedFilter === 'custom' && !customFrom && !customTo)) {
      const now = new Date();
      const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      let from: Date | null = null;
      let to: Date | null = null;
      switch (joinedFilter) {
        case 'last7Days': { const d = new Date(now); d.setDate(d.getDate() - 6); from = startOfDay(d); to = endOfDay(now); break; }
        case 'today': from = startOfDay(now); to = endOfDay(now); break;
        case 'yesterday': { const d = new Date(now); d.setDate(d.getDate() - 1); from = startOfDay(d); to = endOfDay(d); break; }
        case 'thisWeek': { const dow = (now.getDay() + 6) % 7; const monday = new Date(now); monday.setDate(now.getDate() - dow); from = startOfDay(monday); to = endOfDay(now); break; }
        case 'thisMonth': from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)); to = endOfDay(now); break;
        case 'custom':
          from = customFrom ? startOfDay(new Date(customFrom)) : null;
          to = customTo ? endOfDay(new Date(customTo)) : null;
          break;
      }
      const createdAtFilter: any = {};
      if (from) createdAtFilter.gte = from;
      if (to) createdAtFilter.lte = to;
      if (Object.keys(createdAtFilter).length > 0) whereClause.createdAt = createdAtFilter;
    }

    // Tag filter — resolved via the same raw-SQL table used for tags below
    // (may not exist pre-migration; falls back to "no tag filtering" then).
    if (tagFilter !== 'all') {
      try {
        if (tagFilter === '__none__') {
          const taggedRows: any[] = await (prisma as any).$queryRawUnsafe(
            `SELECT DISTINCT vendorId FROM vendor_tag_assignments`
          );
          const taggedIds = taggedRows.map((r) => r.vendorId);
          if (taggedIds.length > 0) andConditions.push({ id: { notIn: taggedIds } });
        } else {
          const matchRows: any[] = await (prisma as any).$queryRawUnsafe(
            `SELECT DISTINCT vendorId FROM vendor_tag_assignments WHERE tag = ?`,
            tagFilter
          );
          andConditions.push({ id: { in: matchRows.map((r) => r.vendorId) } });
        }
      } catch (e: any) {
        logger.warn?.('vendor_tag_assignments filter query failed (migration pending?)', e?.message);
      }
    }

    if (andConditions.length > 0) whereClause.AND = andConditions;

    const orderBy: any =
      sortBy === 'date_asc' ? { createdAt: 'asc' } :
      sortBy === 'rating_desc' ? { rating: 'desc' } :
      sortBy === 'rating_asc' ? { rating: 'asc' } :
      sortBy === 'fleet_desc' ? { vendor_fleets: { _count: 'desc' } } :
      sortBy === 'fleet_asc' ? { vendor_fleets: { _count: 'asc' } } :
      { createdAt: 'desc' };

    // Get vendors — TEMPORARY: fetch all vendors (was: assignedLocationIds.length > 0 ? ... : [])
    const vendors = await prisma.vendors.findMany({
          where: whereClause,
          select: {
            id: true,
            vid: true,
            businessName: true,
            ownerName: true,
            phone: true,
            email: true,
            status: true,
            createdAt: true,
            rating: true,
            totalRatings: true,
            vendor_approved_locations: {
              // ORIGINAL: where: { locationId: { in: assignedLocationIds } },
              include: { locations: { select: { id: true, name: true } } },
            },
            vendor_location_requests: {
              // ORIGINAL: where: { locationId: { in: assignedLocationIds } },
              include: { locations: { select: { id: true, name: true } } },
            },
            vendor_approved_services: {
              include: { services: { select: { id: true, name: true } } },
            },
            vendor_service_requests: {
              include: { services: { select: { id: true, name: true } } },
            },
            _count: {
              select: {
                vendor_documents: true,
                vendor_fleets: true,
              },
            },
          },
          orderBy,
        });

    // Fetch CRM tags via raw SQL — the table is in a new migration that may
    // not be applied yet, and `vendor_tag_assignments` may also be missing
    // from the generated Prisma client until `prisma generate` is run. Wrap
    // in try/catch so the vendor list stays available pre-migration.
    let tagsByVendor: Record<string, string[]> = {};
    if (vendors.length > 0) {
      try {
        const ids = vendors.map((v) => v.id);
        const placeholders = ids.map(() => '?').join(',');
        const rows: any[] = await (prisma as any).$queryRawUnsafe(
          `SELECT vendorId, tag FROM vendor_tag_assignments WHERE vendorId IN (${placeholders})`,
          ...ids,
        );
        for (const r of rows) {
          if (!tagsByVendor[r.vendorId]) tagsByVendor[r.vendorId] = [];
          tagsByVendor[r.vendorId].push(r.tag);
        }
      } catch (e: any) {
        // Table likely doesn't exist yet (migration not applied). Tags will
        // simply be empty arrays — the page renders fine without them.
        logger.warn?.('vendor_tag_assignments query failed (migration pending?)', e?.message);
      }
    }

    // Transform first (needsAttention/pinning below needs the derived fields).
    let transformed = vendors.map((v) => {
      // Combine approved and requested locations
      const approvedLocations = v.vendor_approved_locations.map((al) => al.locations.name);
      const requestedLocations = v.vendor_location_requests.map((lr) => `${lr.locations.name} (Requested)`);
      const allLocations = [...approvedLocations, ...requestedLocations];

      // Combine approved and requested services
      const approvedServices = v.vendor_approved_services.map((as) => as.services.name);
      const requestedServices = v.vendor_service_requests.map((sr) => `${sr.services.name} (Requested)`);
      const allServices = [...approvedServices, ...requestedServices];

      // Only genuinely PENDING requests count as "new" — requestedLocations/
      // requestedServices above include approved/rejected rows too (the
      // request row isn't deleted after review), so this is a separate,
      // correctly-filtered signal for the "new request" badge/filter.
      const pendingLocationRequests = v.vendor_location_requests.filter((lr) => lr.status === 'PENDING');
      const pendingServiceRequests = v.vendor_service_requests.filter((sr) => sr.status === 'PENDING');

      return {
        id: v.id,
        vid: v.vid ?? null,
        businessName: v.businessName,
        ownerName: v.ownerName,
        phone: v.phone,
        email: v.email,
        status: v.status,
        createdAt: v.createdAt,
        rating: v.rating ?? 0,
        totalRatings: v.totalRatings ?? 0,
        locations: allLocations,
        locationNames: approvedLocations,
        services: allServices,
        serviceNames: approvedServices,
        hasPendingLocationRequest: pendingLocationRequests.length > 0,
        hasPendingServiceRequest: pendingServiceRequests.length > 0,
        pendingLocationNames: pendingLocationRequests.map((lr) => lr.locations.name),
        pendingServiceNames: pendingServiceRequests.map((sr) => sr.services.name),
        documentCount: v._count.vendor_documents,
        fleetCount: v._count.vendor_fleets,
        tags: tagsByVendor[v.id] || [],
      };
    });

    // Pin anything needing manager attention to the top — same rule as the
    // page used to apply client-side. A derived cross-cutting sort like this
    // can't be expressed as a plain SQL ORDER BY, so it's done here, after
    // the DB-level where/orderBy above have already narrowed the set down.
    const needsAttention = (v: (typeof transformed)[number]) =>
      v.hasPendingLocationRequest || v.hasPendingServiceRequest || v.status === 'UNDER_REVIEW';
    transformed.sort((a, b) => (needsAttention(b) ? 1 : 0) - (needsAttention(a) ? 1 : 0));

    // Stats over the full filtered set (before pagination slice).
    const stats = {
      total: transformed.length,
      approved: transformed.filter((v) => v.status === 'APPROVED').length,
      pending: transformed.filter((v) => v.status === 'PENDING' || v.status === 'DOCUMENTS_PENDING' || v.status === 'UNDER_REVIEW').length,
      suspended: transformed.filter((v) => v.status === 'SUSPENDED').length,
    };

    const total = transformed.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const skip = (page - 1) * limit;
    const paginatedVendors = transformed.slice(skip, skip + limit);

    // Filter-dropdown options — every location/service that any vendor
    // carries, independent of the current filters (so the dropdown doesn't
    // shrink as other filters narrow the result set).
    const [locationRows, serviceRows] = await Promise.all([
      prisma.locations.findMany({
        where: { vendor_approved_locations: { some: {} } },
        select: { name: true },
        orderBy: { name: 'asc' },
      }).catch(() => []),
      prisma.services.findMany({
        where: { vendor_approved_services: { some: {} } },
        select: { name: true },
        orderBy: { name: 'asc' },
      }).catch(() => []),
    ]);

    return NextResponse.json({
      success: true,
      stats,
      vendors: paginatedVendors,
      locations: locationRows.map((l) => l.name),
      services: serviceRows.map((s) => s.name),
      pagination: { page, limit, total, totalPages },
    });
  } catch (error: any) {
    logger.error('Manager vendors list error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors', details: error?.message },
      { status: 500 }
    );
  }
}
