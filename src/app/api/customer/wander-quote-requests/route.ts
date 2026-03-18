// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const status = searchParams.get('status');

    if (!customerId) return NextResponse.json({ error: 'customer_id required' }, { status: 400 });

    const where: any = { customerId };
    if (status && status !== 'all') where.status = status.toUpperCase();

    const requests = await (prisma as any).wander_quote_requests.findMany({
      where,
      include: {
        listing: {
          select: {
            id: true, title: true, listingId: true, duration: true, images: true,
            category: { select: { name: true, icon: true } },
            mainLocation: { select: { name: true } },
          },
        },
        quotes: {
          select: { id: true, amount: true, status: true, vendorId: true, createdAt: true },
          orderBy: { amount: 'asc' },
        },
        booking: { select: { id: true, status: true, isB2BBooking: true, companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('[Customer Wander Quote Requests GET]', error);
    return NextResponse.json({ error: 'Failed to fetch tour quote requests' }, { status: 500 });
  }
}
