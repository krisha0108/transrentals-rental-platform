// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Support lookup by slug or id
    const identifier = params.id;
    const listing = await (prisma as any).wander_listings.findFirst({
      where: { OR: [{ slug: identifier }, { id: identifier }], status: 'ACTIVE' },
      include: {
        category: { select: { id: true, name: true, icon: true, slug: true, description: true } },
        mainLocation: { select: { id: true, name: true, slug: true } },
        vendor: { select: { id: true, businessName: true, phone: true, logo: true, description: true, rating: true, totalRatings: true, createdAt: true, _count: { select: { wander_listings: { where: { status: 'ACTIVE' } } } } } },
        _count: { select: { quoteRequests: true } },
      },
    });

    if (!listing) return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    return NextResponse.json(listing);
  } catch (error) {
    console.error('[Public Wander Listing GET]', error);
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
  }
}
