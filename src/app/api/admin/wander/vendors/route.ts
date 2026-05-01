// @ts-nocheck
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// Returns distinct vendors who have at least one wander_listing
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rows = await (prisma as any).wander_listings.findMany({
      where: { vendorId: { not: null } },
      select: { vendor: { select: { id: true, businessName: true } } },
      distinct: ['vendorId'],
      orderBy: { vendor: { businessName: 'asc' } },
    });

    const vendors = rows
      .map((r: any) => r.vendor)
      .filter(Boolean);

    return NextResponse.json(vendors);
  } catch (error) {
    console.error('[Admin Wander Vendors]', error);
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}
