import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Counts for the header of /admin/locations.
//
// These deliberately do not come from the list the page is showing: in tree
// view that list is only the root rows with their children nested inside, and
// in flat view it is already narrowed by the type filter. Counting either one
// would report a number that is not "all locations".
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // One pass over the table gives every figure the header needs.
    const rows = await prisma.locations.groupBy({
      by: ['type', 'isActive'],
      _count: { _all: true },
    });

    const byType: Record<string, number> = {};
    let total = 0;
    let active = 0;

    for (const row of rows) {
      const n = row._count._all;
      byType[row.type] = (byType[row.type] || 0) + n;
      total += n;
      if (row.isActive) active += n;
    }

    return NextResponse.json({
      success: true,
      total,
      active,
      inactive: total - active,
      byType,
    });
  } catch (error: any) {
    logger.error('Admin location stats error', error);
    return NextResponse.json(
      { error: 'Failed to fetch location stats', details: error?.message },
      { status: 500 },
    );
  }
}
