import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Statuses the page groups together under a single "Pending (All)" choice —
// everything an admin still has to act on before a vendor goes live.
const PENDING_STATUSES = ['PENDING', 'DOCUMENTS_PENDING', 'UNDER_REVIEW'];

// GET - List all vendors with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const requestFilter = searchParams.get('request') || 'all';
    const sortBy = searchParams.get('sort') || 'date_desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Location and Service are multi-select, so they arrive as a
    // comma-separated list. Empty or 'all' means no filter.
    const multi = (name: string): string[] => {
      const raw = (searchParams.get(name) || '').trim();
      if (!raw || raw === 'all') return [];
      return raw.split(',').map((v) => v.trim()).filter(Boolean);
    };
    const locationFilters = multi('location');
    const serviceFilters = multi('service');

    const where: any = {};
    // Every added condition goes through AND, so a location filter can never
    // overwrite the search filter's OR the way a second top-level OR would.
    const andConditions: any[] = [];

    if (status && status !== 'ALL') {
      where.status = status === 'PENDING_ALL' ? { in: PENDING_STATUSES } : status;
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

    // A vendor matches if it covers ANY of the selected locations / services.
    if (locationFilters.length > 0) {
      andConditions.push({ vendor_approved_locations: { some: { locations: { name: { in: locationFilters } } } } });
    }

    if (serviceFilters.length > 0) {
      andConditions.push({ vendor_approved_services: { some: { services: { name: { in: serviceFilters } } } } });
    }

    // Vendors waiting on an admin decision for a new location or service.
    // Only genuinely PENDING rows count: a request row survives review, so
    // the plain relation count includes approved and rejected ones too.
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

    // Filter by onboarding (registration) date — used for "joined today/this week" tracking
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (andConditions.length > 0) where.AND = andConditions;

    const orderBy: any =
      sortBy === 'date_asc' ? { createdAt: 'asc' } :
      sortBy === 'rating_desc' ? { rating: 'desc' } :
      sortBy === 'rating_asc' ? { rating: 'asc' } :
      sortBy === 'fleet_desc' ? { vendor_fleets: { _count: 'desc' } } :
      sortBy === 'fleet_asc' ? { vendor_fleets: { _count: 'asc' } } :
      { createdAt: 'desc' };

    const [vendors, total, statusCounts, locationRows, serviceRows] = await Promise.all([
      prisma.vendors.findMany({
        where,
        select: {
          id: true,
          vid: true,
          email: true,
          phone: true,
          businessName: true,
          ownerName: true,
          businessType: true,
          status: true,
          rating: true,
          totalRatings: true,
          createdAt: true,
          updatedAt: true,
          approvedAt: true,
          rejectionReason: true,
          vendor_approved_locations: {
            select: { locations: { select: { name: true } } },
          },
          vendor_approved_services: {
            select: { services: { select: { name: true } } },
          },
          vendor_location_requests: {
            where: { status: 'PENDING' },
            select: { locations: { select: { name: true } } },
          },
          vendor_service_requests: {
            where: { status: 'PENDING' },
            select: { services: { select: { name: true } } },
          },
          _count: {
            select: {
              vendor_documents: true,
              vendor_service_requests: true,
              vendor_location_requests: true,
              vendor_approved_services: true,
              vendor_approved_locations: true,
              vendor_fleets: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vendors.count({ where }),
      // Counts cover the whole filtered set, not the page being shown, so the
      // figures stay put while the admin moves through pages.
      prisma.vendors.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      // Dropdown options list every location/service any vendor carries,
      // independent of the current filters — otherwise the dropdown shrinks
      // as you filter and you cannot widen the selection again.
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

    const countFor = (s: string) => statusCounts.find((r) => r.status === s)?._count._all || 0;
    const stats = {
      total,
      approved: countFor('APPROVED'),
      pending: PENDING_STATUSES.reduce((sum, s) => sum + countFor(s), 0),
      suspended: countFor('SUSPENDED'),
    };

    // Remove passwords and transform field names for frontend compatibility
    const safeVendors = vendors.map(
      ({
        password,
        _count,
        vendor_approved_locations,
        vendor_approved_services,
        vendor_location_requests,
        vendor_service_requests,
        ...vendor
      }: any) => ({
        ...vendor,
        locationNames: (vendor_approved_locations || []).map((al: any) => al.locations.name),
        serviceNames: (vendor_approved_services || []).map((as: any) => as.services.name),
        pendingLocationNames: (vendor_location_requests || []).map((lr: any) => lr.locations.name),
        pendingServiceNames: (vendor_service_requests || []).map((sr: any) => sr.services.name),
        _count: {
          documents: _count?.vendor_documents || 0,
          serviceRequests: _count?.vendor_service_requests || 0,
          locationRequests: _count?.vendor_location_requests || 0,
          approvedServices: _count?.vendor_approved_services || 0,
          approvedLocations: _count?.vendor_approved_locations || 0,
          fleets: _count?.vendor_fleets || 0,
        },
      }),
    );

    return NextResponse.json({
      vendors: safeVendors,
      stats,
      locations: locationRows.map((l) => l.name),
      services: serviceRows.map((s) => s.name),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Get vendors error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors', details: error?.message },
      { status: 500 }
    );
  }
}
