// GET — cron job + notification-send health for the Operations Tracker's
// System Health tab. Reads system_event_logs (last 7 days).

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { getSystemHealth } from '@/lib/admin-operations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const currentUser = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const result = await getSystemHealth();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Operations tracker system-health fetch error', error);
    return NextResponse.json({ error: 'Failed to load system health', details: error?.message }, { status: 500 });
  }
}
