// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const request = await (prisma as any).wander_quote_requests.findFirst({
      where: { id: params.id },
      include: {
        listing: {
          select: {
            id: true, slug: true, title: true, listingId: true, duration: true,
            images: true, shortDescription: true,
            priceType: true, basePrice: true, priceTiers: true,
            requireAdvancePayment: true, advancePaymentType: true, advancePaymentValue: true,
            category: { select: { name: true, icon: true } },
            mainLocation: { select: { name: true } },
            vendor: { select: { id: true, businessName: true, phone: true } },
          },
        },
        customer: { select: { id: true, name: true, phone: true, email: true } },
        quotes: {
          include: {
            vendor: { select: { id: true, businessName: true, phone: true } },
          },
          orderBy: { amount: 'asc' },
        },
        booking: true,
      },
    });

    if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    return NextResponse.json(request);
  } catch (error) {
    console.error('[Customer Wander Quote Request GET]', error);
    return NextResponse.json({ error: 'Failed to fetch request' }, { status: 500 });
  }
}
