// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

export const dynamic = 'force-dynamic';

// GET - Incoming quote requests for vendor's listings
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) return NextResponse.json({ error: auth.error }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type') || 'mine'; // 'mine' | 'marketplace' | 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get all listing IDs for this vendor
    const listingIds = await (prisma as any).wander_listings.findMany({
      where: { vendorId: auth.vendorId },
      select: { id: true },
    });
    const ids = listingIds.map((l: any) => l.id);

    // Marketplace eligibility (Option A): vendor must have at least 1 wander listing
    const eligibleForMarketplace = ids.length > 0;

    let scopeWhere: any;
    if (type === 'marketplace') {
      if (!eligibleForMarketplace) {
        return NextResponse.json({ requests: [], total: 0, page: 1, totalPages: 0, eligibleForMarketplace: false });
      }
      // Admin tours, only after admin has broadcasted the request
      scopeWhere = { listing: { vendorId: null }, broadcastedAt: { not: null } };
    } else if (type === 'all') {
      scopeWhere = eligibleForMarketplace
        ? {
            OR: [
              { wanderListingId: { in: ids } },
              { listing: { vendorId: null }, broadcastedAt: { not: null } },
            ],
          }
        : { wanderListingId: { in: ids } };
    } else {
      // mine (default)
      scopeWhere = { wanderListingId: { in: ids } };
    }

    const where: any = { ...scopeWhere };
    if (status && status !== 'all') where.status = status.toUpperCase();

    const [requests, total] = await Promise.all([
      (prisma as any).wander_quote_requests.findMany({
        where,
        include: {
          listing: { select: { id: true, title: true, listingId: true, priceType: true, basePrice: true, priceTiers: true, inclusions: true, exclusions: true, requireAdvancePayment: true, advancePaymentType: true, advancePaymentValue: true, vendorId: true, mainLocation: { select: { name: true } } } },
          customer: { select: { name: true, phone: true, email: true, isB2B: true, b2bStatus: true, companyName: true } },
          quotes: {
            where: { vendorId: auth.vendorId },
            select: { id: true, amount: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).wander_quote_requests.count({ where }),
    ]);

    return NextResponse.json({ requests, total, page, totalPages: Math.ceil(total / limit), eligibleForMarketplace });
  } catch (error) {
    console.error('[Vendor Wander Quotes GET]', error);
    return NextResponse.json({ error: 'Failed to fetch quote requests' }, { status: 500 });
  }
}
