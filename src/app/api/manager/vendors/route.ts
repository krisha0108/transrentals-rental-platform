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

    // TEMPORARY: Show ALL vendors to manager (location/service filter commented out)
    // To restore original filter, uncomment the block below and remove the current whereClause
    const whereClause: any = {};

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
      whereClause.AND = {
        OR: [
          { businessName: { contains: search } },
          { ownerName: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { vid: { contains: search } },
        ],
      };
    }

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
          orderBy: { createdAt: 'desc' },
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

    // Get stats
    const stats = {
      total: vendors.length,
      approved: vendors.filter((v) => v.status === 'APPROVED').length,
      pending: vendors.filter((v) => v.status === 'PENDING' || v.status === 'DOCUMENTS_PENDING' || v.status === 'UNDER_REVIEW').length,
      suspended: vendors.filter((v) => v.status === 'SUSPENDED').length,
    };

    return NextResponse.json({
      success: true,
      stats,
      vendors: vendors.map((v) => {
        // Combine approved and requested locations
        const approvedLocations = v.vendor_approved_locations.map((al) => al.locations.name);
        const requestedLocations = v.vendor_location_requests.map((lr) => `${lr.locations.name} (Requested)`);
        const allLocations = [...approvedLocations, ...requestedLocations];

        // Combine approved and requested services
        const approvedServices = v.vendor_approved_services.map((as) => as.services.name);
        const requestedServices = v.vendor_service_requests.map((sr) => `${sr.services.name} (Requested)`);
        const allServices = [...approvedServices, ...requestedServices];

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
          documentCount: v._count.vendor_documents,
          fleetCount: v._count.vendor_fleets,
          tags: tagsByVendor[v.id] || [],
        };
      }),
    });
  } catch (error: any) {
    logger.error('Manager vendors list error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors', details: error?.message },
      { status: 500 }
    );
  }
}
