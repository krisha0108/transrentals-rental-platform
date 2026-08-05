// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { isVendorServiceActive } from '@/lib/services/vendor-service-status';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get open Bike Quote Requests for vendor (in their approved locations with matching fleet)
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    // Get vendor with approved locations
    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: {
        id: true,
        vendor_approved_locations: { select: { locationId: true } },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const approvedLocationIds = vendor.vendor_approved_locations.map((l) => l.locationId);
    // A vendor who's deactivated Bike Rental on /vendor/services must stop
    // seeing NEW (unclaimed) requests — their own quote history stays
    // visible below, so this only zeroes out the "open" location list.
    const openLocationIds = (await isVendorServiceActive(vendorId, 'bike')) ? approvedLocationIds : [];

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'open', 'quoted', 'won', 'lost'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // DATE FILTER PARAMS
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search')?.trim() || '';

    let whereClause: any = {};

    // DATE FILTERING — parse as local midnight to avoid UTC/IST shift
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        const [sy, sm, sd] = startDate.split('-').map(Number);
        dateFilter.createdAt.gte = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      }
      if (endDate) {
        const [ey, em, ed] = endDate.split('-').map(Number);
        dateFilter.createdAt.lte = new Date(ey, em - 1, ed, 23, 59, 59, 999);
      }
    }

    if (type === 'open') {
      whereClause = {
        ...dateFilter,
        status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
        quotesOpenTill: { gte: new Date() },
        locationId: { in: openLocationIds },
        bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
          none: { vendorId: vendorId, status: { notIn: ['EXPIRED', 'WITHDRAWN'] } },
        },
      };
    } else if (type === 'quoted') {
      whereClause = {
        ...dateFilter,
        bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
          some: { vendorId: vendorId, status: { in: ['SENT', 'VIEWED'] } },
        },
      };
    } else if (type === 'won') {
      whereClause = {
        ...dateFilter,
        bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
          some: { vendorId: vendorId, status: 'ACCEPTED' },
        },
      };
    } else if (type === 'lost') {
      whereClause = {
        ...dateFilter,
        status: 'QUOTE_ACCEPTED',
        bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
          some: { vendorId: vendorId, status: 'REJECTED' },
        },
      };
    } else {
      whereClause = {
        OR: [
          {
            ...dateFilter,
            status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
            quotesOpenTill: { gte: new Date() },
            locationId: { in: openLocationIds },
          },
          {
            ...dateFilter,
            bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
              some: { vendorId: vendorId },
            },
          },
        ],
      };
    }

    // SEARCH — applied via AND so it works for all tabs including "All"
    if (search) {
      whereClause = {
        AND: [
          whereClause,
          {
            OR: [
              { customerName: { contains: search } },
              { customerPhone: { contains: search } },
              { requestNumber: { contains: search } },
              { locationName: { contains: search } },
              { vehicleModelName: { contains: search } },
              { vehicleBrand: { contains: search } },
            ],
          },
        ],
      };
    }

    const [requests, total] = await Promise.all([
      prisma.bike_quote_requests.findMany({
        where: whereClause,
        include: {
          bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
            where: { vendorId: vendorId },
            select: {
              id: true,
              quoteNumber: true,
              grandTotal: true,
              status: true,
              bike_bookings: { select: { id: true, bookingNumber: true, status: true } },
            },
          },
          locations: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bike_quote_requests.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        vehicleModelName: r.vehicleModelName,
        vehicleBrand: r.vehicleBrand,
        vehicleCategory: r.vehicleCategory,
        vehicleCategoryName: r.vehicleCategoryName,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        customerEmail: r.customerEmail,
        locationId: r.locationId,
        locationName: r.locationName,
        location: r.locations,
        pickupDate: r.pickupDate,
        pickupTime: r.pickupTime,
        dropDate: r.dropDate,
        dropTime: r.dropTime,
        totalDays: r.totalDays,
        helmetsRequired: r.helmetsRequired,
        numberOfVehicles: r.numberOfVehicles,
        pickupAddress: r.pickupAddress,
        customerNotes: r.customerNotes,
        budgetMin: r.budgetMin,
        budgetMax: r.budgetMax,
        status: r.status,
        totalQuotesReceived: r.totalQuotesReceived,
        quotesOpenTill: r.quotesOpenTill,
        myQuote: (() => {
          const q = r.bike_quotes_bike_quotes_requestIdTobike_quote_requests[0];
          if (!q) return null;
          return {
            id: q.id,
            quoteNumber: q.quoteNumber,
            grandTotal: q.grandTotal,
            status: q.status,
            bookingId: q.bike_bookings?.id || null,
            bookingNumber: q.bike_bookings?.bookingNumber || null,
            bookingStatus: q.bike_bookings?.status || null,
          };
        })(),
        hasQuoted: r.bike_quotes_bike_quotes_requestIdTobike_quote_requests.length > 0,
        createdAt: r.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor bike quote requests', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests', details: error?.message },
      { status: 500 }
    );
  }
}
