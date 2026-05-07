// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    const where: any = {};
    if (status && status !== 'all') where.status = status.toUpperCase();

    const [requests, total] = await Promise.all([
      (prisma as any).wander_quote_requests.findMany({
        where,
        include: {
          listing: {
            select: {
              id: true, title: true, listingId: true, vendorId: true,
              vendor: { select: { id: true, businessName: true } },
              category: { select: { name: true, icon: true } },
            },
          },
          customer: { select: { id: true, name: true, phone: true, email: true } },
          quotes: {
            select: { id: true, amount: true, status: true, vendorId: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).wander_quote_requests.count({ where }),
    ]);

    return NextResponse.json({ requests, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('[Admin Wander Quotes GET]', error);
    return NextResponse.json({ error: 'Failed to fetch quote requests' }, { status: 500 });
  }
}
