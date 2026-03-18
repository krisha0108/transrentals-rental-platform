// @ts-nocheck
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET - Public: list active experiences with vendor listing count and min price
export async function GET() {
  try {
    const experiences = await (prisma as any).wander_experiences.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        category: { select: { id: true, name: true, icon: true, slug: true } },
        location: { select: { id: true, name: true } },
        listings: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            basePrice: true,
            priceType: true,
            priceTiers: true,
            vendor: { select: { id: true, businessName: true, logo: true } },
            images: true,
          },
        },
      },
    });

    // Enrich each experience with vendorCount and minPrice
    const enriched = experiences.map((exp: any) => {
      const activeListings = exp.listings;
      const vendorCount = activeListings.length;

      let minPrice: number | null = null;
      for (const l of activeListings) {
        let price: number | null = null;
        if (l.priceType === 'GROUP_BASED' && l.priceTiers) {
          try {
            const tiers = JSON.parse(l.priceTiers);
            if (Array.isArray(tiers) && tiers.length > 0) {
              price = Math.min(...tiers.map((t: any) => t.price));
            }
          } catch {}
        } else if (l.basePrice) {
          price = l.basePrice;
        }
        if (price !== null && (minPrice === null || price < minPrice)) minPrice = price;
      }

      // Pick cover image: experience's own, or first listing's first image
      let coverImage = exp.coverImage;
      if (!coverImage) {
        for (const l of activeListings) {
          try {
            const imgs = JSON.parse(l.images || '[]');
            if (imgs[0]) { coverImage = imgs[0]; break; }
          } catch {}
        }
      }

      return { ...exp, vendorCount, minPrice, coverImage, listings: undefined };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('[Public Wander Experiences]', error);
    return NextResponse.json({ error: 'Failed to fetch experiences' }, { status: 500 });
  }
}
