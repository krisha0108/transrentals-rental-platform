// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

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

    // DATE FILTERING
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day (23:59:59)
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = endDateTime;
      }
    }

    if (type === 'open') {
      // Open requests - vendor hasn't quoted yet
      whereClause = {
        status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
        quotesOpenTill: { gte: new Date() },
        locationId: { in: approvedLocationIds },
        ...dateFilter,
        bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
          none: { vendorId: vendorId, status: { notIn: ['EXPIRED', 'WITHDRAWN'] } },
        },
      };
    } else if (type === 'quoted') {
      // Requests where vendor has submitted a quote
      whereClause = {
        ...dateFilter,
        bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
          some: {
            vendorId: vendorId,
            status: { in: ['SENT', 'VIEWED'] },
          },
        },
      };
    } else if (type === 'won') {
      // Requests where vendor's quote was accepted
      whereClause = {
        ...dateFilter,
        bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
          some: {
            vendorId: vendorId,
            status: 'ACCEPTED',
          },
        },
      };
    } else if (type === 'lost') {
      // Requests where another vendor was chosen
      whereClause = {
        status: 'QUOTE_ACCEPTED',
        ...dateFilter,
        bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
          some: {
            vendorId: vendorId,
            status: 'REJECTED',
          },
        },
      };
    } else {
      // All relevant requests
      whereClause = {
        OR: [
          // Open requests in vendor's locations
          {
            status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
            quotesOpenTill: { gte: new Date() },
            locationId: { in: approvedLocationIds },
            ...dateFilter,
          },
          // Requests vendor has quoted on
          {
            ...dateFilter, // ✅ Add date filter here
            bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
              some: { vendorId: vendorId },
            },
          },
        ],
      };
    }

    if (search) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { customerName: { contains: search } },
            { requestNumber: { contains: search } },
            { locationName: { contains: search } },
            { vehicleModelName: { contains: search } },
            { vehicleBrand: { contains: search } },
          ],
        },
      ];
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
        customerNotes: r.customerNotes,
        budgetMin: r.budgetMin,
        budgetMax: r.budgetMax,
        status: r.status,
        totalQuotesReceived: r.totalQuotesReceived,
        quotesOpenTill: r.quotesOpenTill,
        myQuote: r.bike_quotes_bike_quotes_requestIdTobike_quote_requests[0] || null,
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
