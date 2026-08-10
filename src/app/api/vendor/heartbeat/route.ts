// Silent activity heartbeat pinged from the vendor dashboard (web) or the
// vendor app every ~60s while the tab/app is open and foregrounded (see
// useVendorActivityHeartbeat — web version mounted in VendorLayout, app
// version mounted in tr-vendor-app/App.js). Body: { isIdle: boolean,
// platform: 'web' | 'app' } — isIdle is computed client-side from mouse/
// keyboard/scroll (web) or touch (app) inactivity, not from tab/app
// visibility. platform defaults to 'web' if omitted/invalid.
//
// Same mechanism as /api/manager/heartbeat — powers the admin-side
// "active vs idle" tracking on the vendors list, plus which client the
// vendor is currently using.

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
    const platform = body?.platform === 'app' ? 'app' : 'web';
    const now = new Date();
    const today = startOfDay(now);

    await prisma.vendor_presence.upsert({
      where: { vendorId_platform: { vendorId, platform } },
      update: { lastPingAt: now, isIdle },
      create: { vendorId, platform, lastPingAt: now, isIdle },
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

// Called on explicit logout (web sidebar sign-out, app logout) so the
// manager side shows "Offline" immediately instead of waiting out
// PRESENCE_ONLINE_THRESHOLD_MS (~2.5min) for the last heartbeat to go
// stale — that lag was showing a just-logged-out vendor as still online
// across the manager's next couple of polls/reloads.
//
// ?platform=web|app clears only that platform's row — logging out of the
// web dashboard must not wipe the app's presence if the vendor is still
// active there, and vice versa. Defaults to 'web' for older clients.
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const platform = request.nextUrl.searchParams.get('platform') === 'app' ? 'app' : 'web';
    await prisma.vendor_presence.deleteMany({ where: { vendorId: auth.vendorId, platform } });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    logger.error('DELETE /api/vendor/heartbeat', error);
    return NextResponse.json({ error: 'Failed to clear presence' }, { status: 500 });
  }
}
