// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get open Truck Quote Requests for vendor
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: { id: true, vendor_approved_locations: { select: { locationId: true } } },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const approvedLocationIds = vendor.vendor_approved_locations.map((l) => l.locationId);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let whereClause: any = {};

    if (type === 'open') {
      // Show all open requests (location filter relaxed for development)
      // TODO: Re-enable location filter for production: OR: [{ locationId: { in: approvedLocationIds } }, { locationId: null }],
      whereClause = {
        status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
        quotesOpenTill: { gte: new Date() },
        truck_quotes: { none: { vendorId: vendorId } },
      };
    } else if (type === 'quoted') {
      whereClause = { truck_quotes: { some: { vendorId: vendorId, status: { in: ['SENT', 'VIEWED'] } } } };
    } else if (type === 'won') {
      whereClause = { truck_quotes: { some: { vendorId: vendorId, status: 'ACCEPTED' } } };
    } else {
      // Show all requests (location filter relaxed for development)
      whereClause = {
        OR: [
          { status: { in: ['PENDING', 'QUOTES_RECEIVED'] }, quotesOpenTill: { gte: new Date() } },
          { truck_quotes: { some: { vendorId: vendorId } } },
        ],
      };
    }

    const [requests, total] = await Promise.all([
      prisma.truck_quote_requests.findMany({
        where: whereClause,
        include: {
          truck_quotes: { where: { vendorId: vendorId }, select: { id: true, quoteNumber: true, totalAmount: true, status: true } },
          locations: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.truck_quote_requests.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        serviceType: r.serviceType,
        chauffeur_vehicle_categories: r.vehicleCategoryName,
        goodsType: r.goodsType,
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        pickupCity: r.pickupCity,
        dropCity: r.dropCity,
        pickupDate: r.pickupDate,
        requiresLabour: r.requiresLabour,
        labourCount: r.labourCount,
        budgetMin: r.budgetMin,
        budgetMax: r.budgetMax,
        status: r.status,
        totalQuotesReceived: r.totalQuotesReceived,
        quotesOpenTill: r.quotesOpenTill,
        location: r.locations?.name,
        myQuote: r.truck_quotes[0] || null,
        hasQuoted: r.truck_quotes.length > 0,
        createdAt: r.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor truck quote requests', error);
    return NextResponse.json({ error: 'Failed to fetch requests', details: error?.message }, { status: 500 });
  }
}
