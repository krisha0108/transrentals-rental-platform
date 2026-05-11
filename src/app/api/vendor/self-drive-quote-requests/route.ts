// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get open Self-Drive Quote Requests for vendor (in their approved locations with matching fleet)
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
    const search = searchParams.get('search')?.trim() || '';

    // DATE FILTER PARAMS
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter — parse as local midnight so IST dates are correct
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

    // SEARCH conditions (array so we can safely combine with AND later)
    const searchOR: any[] = search
      ? [
          { customerName: { contains: search } },
          { customerPhone: { contains: search } },
          { customerEmail: { contains: search } },
          { requestNumber: { contains: search } },
          { locationName: { contains: search } },
          { vehicleModelName: { contains: search } },
          { vehicleBrand: { contains: search } },
        ]
      : [];

    // Helper: wraps a where-clause with optional search AND
    const withSearch = (clause: any): any =>
      searchOR.length > 0 ? { AND: [{ OR: searchOR }, clause] } : clause;

    let whereClause: any = {};

    if (type === 'open') {
      whereClause = withSearch({
        ...dateFilter,
        status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
        quotesOpenTill: { gte: new Date() },
        locationId: approvedLocationIds.length > 0 ? { in: approvedLocationIds } : undefined,
        self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: {
          none: { vendorId: vendorId, status: { notIn: ['EXPIRED', 'WITHDRAWN'] } },
        },
      });
    } else if (type === 'quoted') {
      whereClause = withSearch({
        ...dateFilter,
        self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: {
          some: { vendorId: vendorId },
        },
      });
    } else if (type === 'won') {
      whereClause = withSearch({
        ...dateFilter,
        self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: {
          some: { vendorId: vendorId, status: 'ACCEPTED' },
        },
      });
    } else if (type === 'lost') {
      whereClause = withSearch({
        ...dateFilter,
        status: 'QUOTE_ACCEPTED',
        self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: {
          some: { vendorId: vendorId, status: 'REJECTED' },
        },
      });
    } else {
      // "All" tab — open requests OR requests this vendor quoted on
      // Must use AND to safely combine search OR with the main OR (spreading two ORs loses one)
      whereClause = withSearch({
        OR: [
          {
            ...dateFilter,
            status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
            quotesOpenTill: { gte: new Date() },
            locationId: approvedLocationIds.length > 0 ? { in: approvedLocationIds } : undefined,
          },
          {
            ...dateFilter,
            self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: {
              some: { vendorId: vendorId },
            },
          },
        ],
      });
    }

    // Separate counts for tab badges (always accurate, irrespective of current filter)
    const [requests, total, newCount, quotedCount] = await Promise.all([
      prisma.self_drive_quote_requests.findMany({
        where: whereClause,
        include: {
          self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: {
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
      prisma.self_drive_quote_requests.count({ where: whereClause }),
      prisma.self_drive_quote_requests.count({
        where: {
          ...dateFilter,
          status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
          quotesOpenTill: { gte: new Date() },
          locationId: approvedLocationIds.length > 0 ? { in: approvedLocationIds } : undefined,
          self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: {
            none: { vendorId: vendorId, status: { notIn: ['EXPIRED', 'WITHDRAWN'] } },
          },
        },
      }),
      prisma.self_drive_quote_requests.count({
        where: {
          ...dateFilter,
          self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: {
            some: { vendorId: vendorId },
          },
        },
      }),
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
        vehicleType: r.vehicleType,
        transmission: r.transmission,
        fuelType: r.fuelType,
        minSeats: r.minSeats,
        numberOfVehicles: r.numberOfVehicles,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        customerEmail: r.customerEmail,
        locationId: r.locationId,
        locationName: r.locationName,
        location: r.locations,
        pickupAddress: r.pickupAddress,
        dropAddress: r.dropAddress,
        pickupDate: r.pickupDate,
        pickupTime: r.pickupTime,
        dropDate: r.dropDate,
        dropTime: r.dropTime,
        totalDays: r.totalDays,
        isDeliveryRequested: r.isDeliveryRequested,
        customerNotes: r.customerNotes,
        budgetMin: r.budgetMin,
        budgetMax: r.budgetMax,
        status: r.status,
        totalQuotesReceived: r.totalQuotesReceived,
        quotesOpenTill: r.quotesOpenTill,
        myQuote: r.self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests[0] || null,
        hasQuoted: r.self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests.length > 0,
        createdAt: r.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      counts: {
        new: newCount,
        quoted: quotedCount,
        all: newCount + quotedCount,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor self-drive quote requests', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests', details: error?.message },
      { status: 500 }
    );
  }
}
