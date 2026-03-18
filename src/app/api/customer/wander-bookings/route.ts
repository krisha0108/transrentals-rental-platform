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

    const bookings = await (prisma as any).wander_bookings.findMany({
      where,
      include: {
        quoteRequest: {
          include: {
            listing: {
              select: {
                id: true, title: true, duration: true, images: true,
                category: { select: { name: true, icon: true } },
                mainLocation: { select: { name: true } },
              },
            },
          },
        },
        quote: {
          select: { amount: true, perPersonAmount: true, vendor: { select: { id: true, businessName: true, phone: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('[Customer Wander Bookings GET]', error);
    return NextResponse.json({ error: 'Failed to fetch tour bookings' }, { status: 500 });
  }
}
