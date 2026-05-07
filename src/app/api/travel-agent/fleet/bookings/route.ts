import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

const VALID_TYPES = ['CUSTOMER', 'MANUAL_BLOCK', 'MAINTENANCE', 'RESERVED'];
const VALID_STATUSES = ['CONFIRMED', 'TENTATIVE', 'COMPLETED', 'CANCELLED'];

function parseDate(val: any): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = parseDate(searchParams.get('from'));
    const to = parseDate(searchParams.get('to'));
    const fleetId = searchParams.get('fleetId');

    // Window defaults to current month if not provided
    const now = new Date();
    const windowFrom = from ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const windowTo = to ?? new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);

    const params: any[] = [auth.travelAgentId, windowTo, windowFrom];
    let sql = `
      SELECT b.id, b.travelAgentId, b.fleetId, b.startDate, b.endDate, b.bookingType,
             b.status, b.customerName, b.customerPhone, b.pickupLocation, b.dropLocation,
             b.amount, b.bookingRefId, b.notes, b.createdAt, b.updatedAt,
             f.vehicleName, f.registrationNumber, f.vehicleType
      FROM travel_agent_fleet_bookings b
      JOIN travel_agent_fleets f ON f.id = b.fleetId
      WHERE b.travelAgentId = ?
        AND b.startDate <= ?
        AND b.endDate   >= ?
        AND b.status <> 'CANCELLED'
    `;
    if (fleetId) {
      sql += ` AND b.fleetId = ? `;
      params.push(fleetId);
    }
    sql += ` ORDER BY b.startDate ASC `;

    const bookings: any[] = await (prisma as any).$queryRawUnsafe(sql, ...params);

    return NextResponse.json({ bookings, range: { from: windowFrom, to: windowTo } });
  } catch (error: any) {
    logger.error('List fleet bookings error', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error?.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      fleetId,
      startDate,
      endDate,
      bookingType,
      status,
      customerName,
      customerPhone,
      pickupLocation,
      dropLocation,
      amount,
      bookingRefId,
      notes,
    } = body;

    if (!fleetId) return NextResponse.json({ error: 'fleetId is required' }, { status: 400 });
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    if (!start || !end) {
      return NextResponse.json({ error: 'Valid startDate and endDate required' }, { status: 400 });
    }
    if (end < start) {
      return NextResponse.json({ error: 'endDate must be after startDate' }, { status: 400 });
    }

    const type = bookingType && VALID_TYPES.includes(bookingType) ? bookingType : 'CUSTOMER';
    const stat = status && VALID_STATUSES.includes(status) ? status : 'CONFIRMED';

    // Confirm fleet belongs to this agent
    const fleet: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT id FROM travel_agent_fleets WHERE id = ? AND travelAgentId = ? LIMIT 1`,
      fleetId,
      auth.travelAgentId,
    );
    if (!fleet.length) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Check overlap with existing non-cancelled bookings
    const overlap: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT id, startDate, endDate, customerName FROM travel_agent_fleet_bookings
       WHERE fleetId = ? AND status <> 'CANCELLED'
         AND startDate <= ? AND endDate >= ?
       LIMIT 1`,
      fleetId,
      end,
      start,
    );
    if (overlap.length && stat !== 'TENTATIVE') {
      return NextResponse.json(
        {
          error: 'This vehicle is already booked/blocked in the selected date range',
          conflict: overlap[0],
        },
        { status: 409 },
      );
    }

    const id = randomUUID().replace(/-/g, '').slice(0, 25);
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO travel_agent_fleet_bookings
        (id, travelAgentId, fleetId, startDate, endDate, bookingType, status,
         customerName, customerPhone, pickupLocation, dropLocation, amount,
         bookingRefId, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
      id,
      auth.travelAgentId,
      fleetId,
      start,
      end,
      type,
      stat,
      customerName || null,
      customerPhone || null,
      pickupLocation || null,
      dropLocation || null,
      amount != null && amount !== '' ? Number(amount) : null,
      bookingRefId || null,
      notes || null,
    );

    const created: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT * FROM travel_agent_fleet_bookings WHERE id = ?`,
      id,
    );

    return NextResponse.json({ booking: created[0] }, { status: 201 });
  } catch (error: any) {
    logger.error('Create fleet booking error', error);
    return NextResponse.json(
      { error: 'Failed to create booking', details: error?.message },
      { status: 500 },
    );
  }
}
