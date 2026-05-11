import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const VALID_TYPES = ['CUSTOMER', 'MANUAL_BLOCK', 'MAINTENANCE', 'RESERVED'];
const VALID_STATUSES = ['CONFIRMED', 'TENTATIVE', 'COMPLETED', 'CANCELLED'];

function parseDate(val: any): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

async function loadOwned(id: string, travelAgentId: string) {
  const rows: any[] = await (prisma as any).$queryRawUnsafe(
    `SELECT * FROM travel_agent_fleet_bookings WHERE id = ? AND travelAgentId = ? LIMIT 1`,
    id,
    travelAgentId,
  );
  return rows[0] || null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const existing = await loadOwned(params.id, auth.travelAgentId);
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const body = await request.json();
    const sets: string[] = [];
    const values: any[] = [];

    const stringFields = ['customerName', 'customerPhone', 'pickupLocation', 'dropLocation', 'notes'];
    for (const f of stringFields) {
      if (body[f] !== undefined) {
        sets.push(`${f} = ?`);
        values.push(body[f] || null);
      }
    }

    if (body.startDate !== undefined) {
      const d = parseDate(body.startDate);
      if (!d) return NextResponse.json({ error: 'Invalid startDate' }, { status: 400 });
      sets.push('startDate = ?');
      values.push(d);
    }
    if (body.endDate !== undefined) {
      const d = parseDate(body.endDate);
      if (!d) return NextResponse.json({ error: 'Invalid endDate' }, { status: 400 });
      sets.push('endDate = ?');
      values.push(d);
    }
    if (body.bookingType !== undefined) {
      if (!VALID_TYPES.includes(body.bookingType)) {
        return NextResponse.json({ error: 'Invalid bookingType' }, { status: 400 });
      }
      sets.push('bookingType = ?');
      values.push(body.bookingType);
    }
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      sets.push('status = ?');
      values.push(body.status);
    }
    if (body.amount !== undefined) {
      sets.push('amount = ?');
      values.push(body.amount === null || body.amount === '' ? null : Number(body.amount));
    }

    if (!sets.length) {
      return NextResponse.json({ booking: existing });
    }

    sets.push('updatedAt = NOW(3)');
    const sql = `UPDATE travel_agent_fleet_bookings SET ${sets.join(', ')} WHERE id = ?`;
    values.push(params.id);
    await (prisma as any).$executeRawUnsafe(sql, ...values);

    const updated = await loadOwned(params.id, auth.travelAgentId);
    return NextResponse.json({ booking: updated });
  } catch (error: any) {
    logger.error('Update fleet booking error', error);
    return NextResponse.json(
      { error: 'Failed to update booking', details: error?.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const existing = await loadOwned(params.id, auth.travelAgentId);
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    await (prisma as any).$executeRawUnsafe(
      `DELETE FROM travel_agent_fleet_bookings WHERE id = ?`,
      params.id,
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Delete fleet booking error', error);
    return NextResponse.json(
      { error: 'Failed to delete booking', details: error?.message },
      { status: 500 },
    );
  }
}
