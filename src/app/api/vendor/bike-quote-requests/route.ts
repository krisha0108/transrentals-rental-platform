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

    // Get vendor with approved locations and services
    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: {
        id: true,
        vendor_approved_locations: { select: { locationId: true } },
        vendor_approved_services: {
          where: {
            isActive: true,
            services: { slug: 'bike-on-rent' },
          },
          select: { serviceId: true },
        },
        vendor_fleets: {
          where: {
            isActive: true,
            services: { slug: 'bike-on-rent' },
          },
          select: {
            id: true,
            vehicleCategoryId: true,
            chauffeur_vehicle_categories: { select: { slug: true } },
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check if vendor is approved for bike-on-rent service
    if (vendor.vendor_approved_services.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'You are not approved for bike rental service',
        requests: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });
    }

    const approvedLocationIds = vendor.vendor_approved_locations.map((l) => l.locationId);
    const fleetCategorySlugs = vendor.vendor_fleets
      .map((f) => f.chauffeur_vehicle_categories?.slug)
      .filter(Boolean);
    const fleetCategoryIds = vendor.vendor_fleets
      .map((f) => f.vehicleCategoryId)
      .filter(Boolean);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'open', 'quoted', 'won', 'lost'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    // Build category filter - if vendor has no fleet, show all requests
    // Otherwise filter by matching categories (supports both slug and ID matching)
    const hasCategoryFilter = fleetCategorySlugs.length > 0 || fleetCategoryIds.length > 0;
    const categoryFilter = hasCategoryFilter
      ? {
          OR: [
            { vehicleCategory: null },
            { vehicleCategory: { in: fleetCategorySlugs } },
            { vehicleCategory: { in: fleetCategoryIds } },
          ],
        }
      : {}; // No category filter if vendor has no fleet - show all requests

    if (type === 'open') {
      // Open requests - vendor hasn't quoted yet
      // Must match: location + (no category OR matching category if vendor has fleet)
      whereClause = {
        status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
        quotesOpenTill: { gte: new Date() },
        locationId: { in: approvedLocationIds },
        ...categoryFilter,
        bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
          none: { vendorId: vendorId },
        },
      };
    } else if (type === 'quoted') {
      // Requests where vendor has submitted a quote
      whereClause = {
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
            ...categoryFilter,
          },
          // Requests vendor has quoted on
          {
            bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
              some: { vendorId: vendorId },
            },
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
        vehicleModelName: r.vehicle_modelsName,
        vehicleBrand: r.vehicleBrand,
        chauffeur_vehicle_categories: r.vehicle_category,
        vehicleCategoryName: r.vehicleCategoryName,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
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
