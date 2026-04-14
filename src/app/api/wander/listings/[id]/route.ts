// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

function safeJson(val: any, fallback: any = []) {
  if (Array.isArray(val) || (val && typeof val === 'object')) return val;
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const identifier = params.id;
    const raw = await (prisma as any).wander_listings.findFirst({
      where: { OR: [{ slug: identifier }, { id: identifier }], status: 'ACTIVE' },
      include: {
        category:     { select: { id: true, name: true, icon: true, slug: true, description: true } },
        mainLocation: { select: { id: true, name: true, slug: true } },
        vendor: {
          select: {
            id: true, businessName: true, phone: true, logo: true,
            description: true, rating: true, totalRatings: true, createdAt: true,
            _count: { select: { wander_listings: { where: { status: 'ACTIVE' } } } },
          },
        },
        _count: { select: { quoteRequests: true } },
      },
    });

    if (!raw) return NextResponse.json({ error: 'Tour not found' }, { status: 404 });

    // Parse all JSON string fields stored as LongText
    const listing = {
      ...raw,
      images:     safeJson(raw.images, []),
      priceTiers: safeJson(raw.priceTiers, []),
      inclusions: safeJson(raw.inclusions, []),
      exclusions: safeJson(raw.exclusions, []),
      highlights: safeJson(raw.highlights, []),
      itinerary:  safeJson(raw.itinerary, []),
      tripTypes:  safeJson(raw.tripTypes, []),
      occasions:  safeJson(raw.occasions, []),
      // Normalise vendor.name for the app
      vendor: raw.vendor ? { ...raw.vendor, name: raw.vendor.businessName } : null,
    };

    return NextResponse.json({ listing });
  } catch (error) {
    console.error('[Public Wander Listing GET]', error);
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
  }
}
