// GET — active/idle time totals + current presence + a day-by-day breakdown
// for one vendor, over a date range. ?filter=&dateFrom=&dateTo=
// Same mechanism/shape as /api/admin/managers/performance/activity, with an
// added `byDay` breakdown since "which day had how much time" is what the
// admin vendors detail page actually needs to show.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { getDateRange } from '@/lib/manager-performance';
import { aggregateVendorPresence } from '@/lib/presence';

export const dynamic = 'force-dynamic';

// See matching comment in /api/vendor/heartbeat — must use the same
// UTC-midnight construction as the write side or the DATE-column range
// comparison silently returns nothing on servers with a non-zero UTC offset.
function startOfDay(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD, UTC — matches the @db.Date column
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = params.id;
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'thisMonth';
    const customFrom = searchParams.get('dateFrom');
    const customTo = searchParams.get('dateTo');
    const range = getDateRange(filter, customFrom, customTo) as { gte?: Date; lte?: Date; lt?: Date };

    const dateWhere: { gte?: Date; lte?: Date } = {};
    if (range.gte) dateWhere.gte = startOfDay(range.gte);
    if (range.lte) dateWhere.lte = startOfDay(range.lte);
    else if (range.lt) dateWhere.lte = startOfDay(new Date(range.lt.getTime() - 1));

    const [sessions, presenceRows] = await Promise.all([
      prisma.vendor_activity_sessions.findMany({
        where: { vendorId, ...(Object.keys(dateWhere).length > 0 ? { date: dateWhere } : {}) },
        orderBy: { date: 'desc' },
        select: { date: true, startAt: true, endAt: true, activeSeconds: true, idleSeconds: true },
      }),
      prisma.vendor_presence.findMany({ where: { vendorId } }),
    ]);

    const totals = { activeSeconds: 0, idleSeconds: 0 };
    const byDayMap = new Map<string, { date: string; activeSeconds: number; idleSeconds: number }>();

    for (const s of sessions) {
      totals.activeSeconds += s.activeSeconds;
      totals.idleSeconds += s.idleSeconds;

      const key = dayKey(s.date);
      const entry = byDayMap.get(key) || { date: key, activeSeconds: 0, idleSeconds: 0 };
      entry.activeSeconds += s.activeSeconds;
      entry.idleSeconds += s.idleSeconds;
      byDayMap.set(key, entry);
    }

    const byDay = Array.from(byDayMap.values()).sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({
      activeSeconds: totals.activeSeconds,
      idleSeconds: totals.idleSeconds,
      byDay,
      presence: aggregateVendorPresence(presenceRows),
    });
  } catch (error: any) {
    logger.error('Vendor activity fetch error', error);
    return NextResponse.json({ error: 'Failed to fetch activity', details: error?.message }, { status: 500 });
  }
}
