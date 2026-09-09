// POST — manually trigger a sync. Body: { accountId?: string } — syncs just
// that account, or every active account when omitted (used by the
// dashboard's "Sync Now" button; a scheduled job can hit this same route).

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { syncAccount, syncAllActiveAccounts } from '@/lib/social/sync';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const admin = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
    if (!admin || !['SUPER_ADMIN', 'ADMIN'].includes(admin.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const results = body?.accountId
      ? [await syncAccount(body.accountId)]
      : await syncAllActiveAccounts();

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    logger.error('Social media sync request failed', error);
    return NextResponse.json({ error: error?.message || 'Sync failed' }, { status: 500 });
  }
}
