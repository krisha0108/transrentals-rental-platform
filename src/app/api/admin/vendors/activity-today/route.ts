// GET — today's active/idle seconds for EVERY vendor in one query, for the
// "Today's Activity" column on the vendor performance list. Same mechanism
// as /api/admin/vendors/[id]/activity, just bulk + scoped to today so a list
// page doesn't have to fire one request per vendor row.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// See matching comment in /api/vendor/heartbeat — must use the same
// UTC-midnight construction as the write side or the DATE-column comparison
// silently returns nothing on servers with a non-zero UTC offset.
function startOfDay(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = startOfDay(new Date());
    const rows = await prisma.vendor_activity_sessions.findMany({
      where: { date: today },
      select: { vendorId: true, activeSeconds: true, idleSeconds: true },
    });

    const activity: Record<string, { activeSeconds: number; idleSeconds: number }> = {};
    for (const r of rows) {
      const entry = activity[r.vendorId] || { activeSeconds: 0, idleSeconds: 0 };
      entry.activeSeconds += r.activeSeconds;
      entry.idleSeconds += r.idleSeconds;
      activity[r.vendorId] = entry;
    }

    return NextResponse.json({ activity });
  } catch (error: any) {
    logger.error('Vendor today-activity fetch error', error);
    return NextResponse.json({ error: 'Failed to fetch activity', details: error?.message }, { status: 500 });
  }
}
