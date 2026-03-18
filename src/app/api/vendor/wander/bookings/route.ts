// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId)
      return NextResponse.json({ error: auth.error }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PAYMENT_PENDING, PAYMENT_SUBMITTED, CONFIRMED, etc.
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { vendorId: auth.vendorId };
    if (status && status !== 'all') where.status = status.toUpperCase();

    const [bookings, total] = await Promise.all([
      (prisma as any).wander_bookings.findMany({
        where,
        include: {
          customer: { select: { name: true, phone: true, email: true } },
          quoteRequest: {
            select: {
              pickupLocation: true,
              requirements: true,
              listing: { select: { title: true, duration: true } },
            },
          },
          quote: { select: { amount: true, perPersonAmount: true, notes: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).wander_bookings.count({ where }),
    ]);

    return NextResponse.json({
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('[Vendor Wander Bookings GET]', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
