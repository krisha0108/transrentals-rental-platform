// Silent activity heartbeat pinged from the manager panel every ~60s while
// the tab is open and visible (see useActivityTracking in the manager
// layout). Body: { isIdle: boolean } — isIdle is computed client-side from
// mouse/keyboard/scroll inactivity, not from tab visibility.
//
// Powers the admin-side "active vs idle" tracking on the managers list and
// the Manager Performance detail page.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// Client pings every PING_INTERVAL_SECONDS while active. If a session's last
// ping is older than this, treat it as a fresh session instead of extending
// the old one (manager was fully offline in between — tab closed, laptop
// slept, etc.) — that gap isn't counted as idle since we have no signal for
// it either way.
const PING_INTERVAL_SECONDS = 60;
const SESSION_CONTINUITY_MS = 150 * 1000;

async function requireManager() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const manager = await prisma.admin_users.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!manager || manager.role !== 'MANAGER') return null;
  return manager.id;
}

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
    const managerId = await requireManager();
    if (!managerId) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const isIdle = body?.isIdle === true;
    const now = new Date();
    const today = startOfDay(now);

    await prisma.manager_presence.upsert({
      where: { managerId },
      update: { lastPingAt: now, isIdle },
      create: { managerId, lastPingAt: now, isIdle },
    });

    const lastSession = await prisma.manager_activity_sessions.findFirst({
      where: { managerId, date: today },
      orderBy: { endAt: 'desc' },
    });

    if (lastSession && now.getTime() - lastSession.endAt.getTime() <= SESSION_CONTINUITY_MS) {
      await prisma.manager_activity_sessions.update({
        where: { id: lastSession.id },
        data: {
          endAt: now,
          activeSeconds: isIdle ? lastSession.activeSeconds : lastSession.activeSeconds + PING_INTERVAL_SECONDS,
          idleSeconds: isIdle ? lastSession.idleSeconds + PING_INTERVAL_SECONDS : lastSession.idleSeconds,
        },
      });
    } else {
      await prisma.manager_activity_sessions.create({
        data: {
          managerId,
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
    logger.error('POST /api/manager/heartbeat', error);
    return NextResponse.json({ error: 'Failed to record heartbeat' }, { status: 500 });
  }
}
