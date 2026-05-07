import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; bookingId: string } },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const rows: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT id FROM travel_agent_fleet_bookings
       WHERE id = ? AND travelAgentId = ? AND bookingRefId = ? LIMIT 1`,
      params.bookingId,
      auth.travelAgentId,
      params.id,
    );
    if (!rows.length) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    await (prisma as any).$executeRawUnsafe(
      `DELETE FROM travel_agent_fleet_bookings WHERE id = ?`,
      params.bookingId,
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Unassign vehicle from lead error', error);
    return NextResponse.json(
      { error: 'Failed to unassign vehicle', details: error?.message },
      { status: 500 },
    );
  }
}
