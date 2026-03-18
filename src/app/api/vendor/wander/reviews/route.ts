// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

export const dynamic = 'force-dynamic';

// GET - Vendor fetches all reviews for their listings
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const statusFilter = searchParams.get('status') || 'all';

    // Get all listing IDs for this vendor
    const listings = await (prisma as any).wander_listings.findMany({
      where: { vendorId: auth.vendorId },
      select: { id: true },
    });
    const listingIds = listings.map((l: any) => l.id);

    const where: any = { listingId: { in: listingIds } };
    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter;
    }

    const [reviews, total] = await Promise.all([
      (prisma as any).wander_reviews.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          listing: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).wander_reviews.count({ where }),
    ]);

    return NextResponse.json({
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[Vendor Wander Reviews GET]', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
