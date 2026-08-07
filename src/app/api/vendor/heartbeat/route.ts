// Silent activity heartbeat pinged from the vendor dashboard every ~60s while
// the tab is open and visible (see useVendorActivityHeartbeat, mounted in
// VendorLayout). Body: { isIdle: boolean } — isIdle is computed client-side
// from mouse/keyboard/scroll inactivity, not from tab visibility.
//
// Same mechanism as /api/manager/heartbeat — powers the admin-side
// "active vs idle" tracking on the vendors list.

import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// Client pings every PING_INTERVAL_SECONDS while active. If a session's last
// ping is older than this, treat it as a fresh session instead of extending
// the old one (vendor was fully offline in between — tab closed, laptop
// slept, etc.) — that gap isn't counted as idle since we have no signal for
// it either way.
const PING_INTERVAL_SECONDS = 60;
const SESSION_CONTINUITY_MS = 150 * 1000;

// A @db.Date column stores/compares as a UTC-midnight DATETIME under the
// hood — building this from *local* Y/M/D but with `new Date(y, m, d)`
// (which is local-midnight, not UTC-midnight) shifts the stored calendar
// day backward by a server's positive UTC offset (e.g. IST). Date.UTC
// keeps the same local Y/M/D label while producing the UTC-midnight
// instant MySQL actually expects.
function startOfDay(d: Date) {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const body = await request.json().catch(() => ({}));
    const isIdle = body?.isIdle === true;
    const now = new Date();
    const today = startOfDay(now);

    await prisma.vendor_presence.upsert({
      where: { vendorId },
      update: { lastPingAt: now, isIdle },
      create: { vendorId, lastPingAt: now, isIdle },
    });

    const lastSession = await prisma.vendor_activity_sessions.findFirst({
      where: { vendorId, date: today },
      orderBy: { endAt: 'desc' },
    });

    if (lastSession && now.getTime() - lastSession.endAt.getTime() <= SESSION_CONTINUITY_MS) {
      await prisma.vendor_activity_sessions.update({
        where: { id: lastSession.id },
        data: {
          endAt: now,
          activeSeconds: isIdle ? lastSession.activeSeconds : lastSession.activeSeconds + PING_INTERVAL_SECONDS,
          idleSeconds: isIdle ? lastSession.idleSeconds + PING_INTERVAL_SECONDS : lastSession.idleSeconds,
        },
      });
    } else {
      await prisma.vendor_activity_sessions.create({
        data: {
          vendorId,
          date: today,
          startAt: now,
          endAt: now,
          activeSeconds: 0,
          idleSeconds: 0,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    logger.error('POST /api/vendor/heartbeat', error);
    return NextResponse.json({ error: 'Failed to record heartbeat' }, { status: 500 });
  }
}
