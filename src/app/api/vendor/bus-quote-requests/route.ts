// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get open Bus Quote Requests for vendor (in their approved locations)
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
    const search = searchParams.get('search')?.trim() || '';

    // Build date filter object
    let dateFilter: any = undefined;
    if (startDate || endDate) {
      dateFilter = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day (23:59:59)
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.lte = endDateTime;
      }
    }

    let whereClause: any = {};

    if (type === 'open') {
      // Open requests - vendor hasn't quoted yet
      whereClause = {
        status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
        quotesOpenTill: { gte: new Date() },
        OR: [
          { locationId: { in: approvedLocationIds } },
          { locationId: null }, // Requests without specific location
        ],
        bus_quotes_bus_quotes_requestIdTobus_quote_requests: {
          none: { vendorId: vendorId, status: { notIn: ['EXPIRED', 'WITHDRAWN'] } },
        },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      };
    } else if (type === 'quoted') {
      // Requests where vendor has submitted a quote
      whereClause = {
        bus_quotes_bus_quotes_requestIdTobus_quote_requests: {
          some: {
            vendorId: vendorId,
            status: { in: ['SENT', 'VIEWED'] },
          },
        },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      };
    } else if (type === 'won') {
      // Requests where vendor's quote was accepted
      whereClause = {
        bus_quotes: {
          some: {
            vendorId: vendorId,
            status: 'ACCEPTED',
          },
        },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      };
    } else if (type === 'lost') {
      // Requests where another vendor was chosen
      whereClause = {
        status: 'QUOTE_ACCEPTED',
        bus_quotes: {
          some: {
            vendorId: vendorId,
            status: 'REJECTED',
          },
        },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
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
            ...(dateFilter ? { createdAt: dateFilter } : {}),
          },
          // Requests vendor has quoted on
          {
            bus_quotes_bus_quotes_requestIdTobus_quote_requests: {
              some: { vendorId: vendorId },
            },
            ...(dateFilter ? { createdAt: dateFilter } : {}),
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
            { pickupCity: { contains: search } },
            { dropCity: { contains: search } },
            { vehicleCategoryName: { contains: search } },
          ],
        },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.bus_quote_requests.findMany({
        where: whereClause,
        include: {
          bus_quotes_bus_quotes_requestIdTobus_quote_requests: {
            where: { vendorId: vendorId },
            select: {
              id: true,
              quoteNumber: true,
              totalAmount: true,
              status: true,
              bus_bookings: { select: { id: true, bookingNumber: true, status: true } },
            },
          },
          locations: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bus_quote_requests.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        tripType: r.tripType,
        chauffeur_vehicle_categories: r.vehicle_category,
        vehicleCategoryName: r.vehicleCategoryName,
        passengers: r.passengers,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        customerEmail: r.customerEmail,
        pickupCity: r.pickupCity,
        dropCity: r.dropCity,
        routeDetails: r.routeDetails,
        pickupDate: r.pickupDate,
        pickupTime: r.pickupTime,
        returnDate: r.returnDate,
        tripDays: r.tripDays,
        requirements: r.requirements,
        needAC: r.needAC,
        needLuxury: r.needLuxury,
        budgetMin: r.budgetMin,
        budgetMax: r.budgetMax,
        status: r.status,
        totalQuotesReceived: r.totalQuotesReceived,
        quotesOpenTill: r.quotesOpenTill,
        location: r.locations?.name,
        myQuote: (() => {
          const q = r.bus_quotes_bus_quotes_requestIdTobus_quote_requests[0];
          if (!q) return null;
          return {
            id: q.id,
            quoteNumber: q.quoteNumber,
            totalAmount: q.totalAmount,
            status: q.status,
            bookingId: q.bus_bookings?.id || null,
            bookingNumber: q.bus_bookings?.bookingNumber || null,
          };
        })(),
        hasQuoted: r.bus_quotes_bus_quotes_requestIdTobus_quote_requests.length > 0,
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
    logger.error('Failed to fetch vendor bus quote requests', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests', details: error?.message },
      { status: 500 }
    );
  }
}
