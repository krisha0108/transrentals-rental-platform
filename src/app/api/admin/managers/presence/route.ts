// GET — presence (active/idle/offline + last seen) for every manager, for
// the status dots on the admin managers list.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { getPresenceStatus } from '@/lib/manager-performance';

export const dynamic = 'force-dynamic';

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

    const rows = await prisma.manager_presence.findMany();
    const presence: Record<string, { status: string; lastSeenAt: string | null }> = {};
    for (const row of rows) {
      presence[row.managerId] = {
        status: getPresenceStatus(row.lastPingAt, row.isIdle),
        lastSeenAt: row.lastPingAt.toISOString(),
      };
    }

    return NextResponse.json({ presence });
  } catch (error: any) {
    logger.error('Manager presence fetch error', error);
    return NextResponse.json({ error: 'Failed to fetch presence', details: error?.message }, { status: 500 });
  }
}
