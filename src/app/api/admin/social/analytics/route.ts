// GET — aggregate analytics over already-synced posts/daily-stats: top
// posts by engagement, per-platform averages, follower history, and
// posting frequency. Pure read/rollup, no live Meta calls.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { getSocialAnalytics, getDateRange } from '@/lib/social/analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const currentUser = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const dateFilter = getDateRange(filter, searchParams.get('dateFrom'), searchParams.get('dateTo'));
    const dateFilterObj = Object.keys(dateFilter).length > 0 ? { publishedAt: dateFilter } : {};

    const result = await getSocialAnalytics(dateFilterObj);
    return NextResponse.json({ success: true, filter, ...result });
  } catch (error: any) {
    logger.error('Social analytics fetch error', error);
    return NextResponse.json({ error: 'Failed to load social analytics', details: error?.message }, { status: 500 });
  }
}
