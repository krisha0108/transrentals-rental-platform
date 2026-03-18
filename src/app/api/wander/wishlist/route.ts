// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET - Get customer's wishlist
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) return NextResponse.json({ error: 'customerId required' }, { status: 400 });

    const wishlists = await (prisma as any).wander_wishlists.findMany({
      where: { customerId },
      include: {
        listing: {
          select: {
            id: true, slug: true, title: true, shortDescription: true, duration: true, images: true,
            basePrice: true, priceType: true, priceTiers: true, rating: true, totalRatings: true,
            tourStartDate: true, tourEndDate: true, status: true,
            category: { select: { name: true, icon: true } },
            mainLocation: { select: { name: true } },
            vendor: { select: { businessName: true, logo: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter out inactive listings
    const active = wishlists.filter((w: any) => w.listing?.status === 'ACTIVE');

    return NextResponse.json({ wishlists: active });
  } catch (error) {
    console.error('[Wander Wishlist GET]', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

// POST - Toggle wishlist (add/remove)
export async function POST(request: NextRequest) {
  try {
    const { customerId, listingId } = await request.json();

    if (!customerId || !listingId) {
      return NextResponse.json({ error: 'customerId and listingId required' }, { status: 400 });
    }

    // Check if already wishlisted
    const existing = await (prisma as any).wander_wishlists.findUnique({
      where: { customerId_listingId: { customerId, listingId } },
    });

    if (existing) {
      // Remove
      await (prisma as any).wander_wishlists.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ success: true, action: 'removed', wishlisted: false });
    } else {
      // Add
      await (prisma as any).wander_wishlists.create({
        data: { customerId, listingId },
      });
      return NextResponse.json({ success: true, action: 'added', wishlisted: true });
    }
  } catch (error) {
    console.error('[Wander Wishlist POST]', error);
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}
