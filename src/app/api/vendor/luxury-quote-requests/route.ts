// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get open Luxury Quote Requests for vendor (in their approved locations)
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

    // PAGINATION PARAMS
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // DATE FILTER PARAMS
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter — parse as local midnight to avoid UTC/IST shift
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

    let whereClause: any = {};

    if (type === 'open') {
      // Open requests - vendor hasn't quoted yet
      whereClause = {
        ...dateFilter,
        status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
        quotesOpenTill: { gte: new Date() },
        OR: [
          { locationId: { in: approvedLocationIds } },
          { locationId: null }, // Requests without specific location
        ],
        luxury_quotes: {
          none: { vendorId: vendorId, status: { notIn: ['EXPIRED', 'WITHDRAWN'] } },
        },
      };
    } else if (type === 'quoted') {
      // Requests where vendor has submitted a quote
      whereClause = {
        ...dateFilter,
        luxury_quotes: {
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
        luxury_quotes: {
          some: {
            vendorId: vendorId,
            status: 'ACCEPTED',
          },
        },
      };
    } else if (type === 'lost') {
      // Requests where another vendor was chosen
      whereClause = {
        ...dateFilter,
        status: 'QUOTE_ACCEPTED',
        luxury_quotes: {
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
            OR: [
              { locationId: { in: approvedLocationIds } },
              { locationId: null },
            ],
            ...dateFilter, // ✅ Add date filter
          },
          // Requests vendor has quoted on
          {
            ...dateFilter, // ✅ Add date filter
            luxury_quotes: {
              some: { vendorId: vendorId },
            },
          },
        ],
      };
    }

    const [requests, total] = await Promise.all([
      prisma.luxury_quote_requests.findMany({
        where: whereClause,
        include: {
          luxury_quotes: {
            where: { vendorId: vendorId },
            select: {
              id: true,
              quoteNumber: true,
              totalAmount: true,
              status: true,
            },
          },
          locations: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.luxury_quote_requests.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        tripType: r.tripType,
        occasion: r.occasion,
        chauffeur_vehicle_categories: r.vehicle_category,
        vehicleCategoryName: r.vehicleCategoryName,
        passengers: r.passengers,
        specificModel: r.specificModel,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        pickupCity: r.pickupCity,
        pickupAddress: r.pickupAddress,
        dropCity: r.dropCity,
        dropAddress: r.dropAddress,
        routeDetails: r.routeDetails,
        pickupDate: r.pickupDate,
        pickupTime: r.pickupTime,
        returnDate: r.returnDate,
        returnTime: r.returnTime,
        tripDays: r.tripDays,
        tripHours: r.tripHours,
        packageType: r.packageType,
        requirements: r.requirements,
        needChauffeur: r.needChauffeur,
        needDecoration: r.needDecoration,
        decorationType: r.decorationType,
        budgetMin: r.budgetMin,
        budgetMax: r.budgetMax,
        status: r.status,
        totalQuotesReceived: r.totalQuotesReceived,
        quotesOpenTill: r.quotesOpenTill,
        location: r.locations?.name,
        myQuote: r.luxury_quotes[0] || null, // Vendor's quote if exists
        hasQuoted: r.luxury_quotes.length > 0,
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
    logger.error('Failed to fetch vendor luxury quote requests', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests', details: error?.message },
      { status: 500 }
    );
  }
}
