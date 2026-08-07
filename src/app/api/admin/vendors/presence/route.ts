// GET — presence (active/idle/offline + last seen) for every vendor, for the
// status dots on the admin vendors list. Same shape/mechanism as
// /api/admin/managers/presence, just keyed by vendorId.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { getPresenceStatus } from '@/lib/presence';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await prisma.vendor_presence.findMany();
    const presence: Record<string, { status: string; lastSeenAt: string | null }> = {};
    for (const row of rows) {
      presence[row.vendorId] = {
        status: getPresenceStatus(row.lastPingAt, row.isIdle),
        lastSeenAt: row.lastPingAt.toISOString(),
      };
    }

    return NextResponse.json({ presence });
  } catch (error: any) {
    logger.error('Vendor presence fetch error', error);
    return NextResponse.json({ error: 'Failed to fetch presence', details: error?.message }, { status: 500 });
  }
}
