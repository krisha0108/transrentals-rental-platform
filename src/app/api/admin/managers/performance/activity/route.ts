// GET — active/idle time totals + current presence for one manager, over a
// date range. ?managerId=&filter=&dateFrom=&dateTo=
// Powers the "Activity" card on the Manager Performance detail page.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { getDateRange, getPresenceStatus } from '@/lib/manager-performance';

export const dynamic = 'force-dynamic';

// See matching comment in /api/manager/heartbeat — must use the same
// UTC-midnight construction as the write side or the DATE-column range
// comparison silently returns nothing on servers with a non-zero UTC offset.
function startOfDay(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const currentUser = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get('managerId');
    if (!managerId) {
      return NextResponse.json({ error: 'managerId is required' }, { status: 400 });
    }
    const filter = searchParams.get('filter') || 'today';
    const customFrom = searchParams.get('dateFrom');
    const customTo = searchParams.get('dateTo');
    const range = getDateRange(filter, customFrom, customTo) as { gte?: Date; lte?: Date; lt?: Date };

    // manager_activity_sessions.date is a plain DATE column keyed to the
    // session's local start-of-day, so we widen the range to whole days.
    const dateWhere: { gte?: Date; lte?: Date } = {};
    if (range.gte) dateWhere.gte = startOfDay(range.gte);
    if (range.lte) dateWhere.lte = startOfDay(range.lte);
    else if (range.lt) dateWhere.lte = startOfDay(new Date(range.lt.getTime() - 1));

    const [sessions, presenceRow] = await Promise.all([
      prisma.manager_activity_sessions.findMany({
        where: { managerId, ...(Object.keys(dateWhere).length > 0 ? { date: dateWhere } : {}) },
        orderBy: { startAt: 'asc' },
        select: { startAt: true, endAt: true, activeSeconds: true, idleSeconds: true },
      }),
      prisma.manager_presence.findUnique({ where: { managerId } }),
    ]);

    const totals = sessions.reduce(
      (acc, s) => {
        acc.activeSeconds += s.activeSeconds;
        acc.idleSeconds += s.idleSeconds;
        return acc;
      },
      { activeSeconds: 0, idleSeconds: 0 }
    );

    return NextResponse.json({
      activeSeconds: totals.activeSeconds,
      idleSeconds: totals.idleSeconds,
      sessions: sessions.map((s) => ({
        startAt: s.startAt.toISOString(),
        endAt: s.endAt.toISOString(),
        activeSeconds: s.activeSeconds,
        idleSeconds: s.idleSeconds,
      })),
      presence: {
        status: getPresenceStatus(presenceRow?.lastPingAt, presenceRow?.isIdle),
        lastSeenAt: presenceRow?.lastPingAt ? presenceRow.lastPingAt.toISOString() : null,
      },
    });
  } catch (error: any) {
    logger.error('Manager activity fetch error', error);
    return NextResponse.json({ error: 'Failed to fetch activity', details: error?.message }, { status: 500 });
  }
}
