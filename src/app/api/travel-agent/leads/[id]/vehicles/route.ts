import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

function parseDate(val: any): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

async function loadLead(id: string, travelAgentId: string) {
  const rows: any[] = await (prisma as any).$queryRawUnsafe(
    `SELECT id, travelAgentId, customerName, customerPhone, pickupLocation, dropLocation,
            travelDate, returnDate
     FROM travel_agent_leads WHERE id = ? AND travelAgentId = ? LIMIT 1`,
    id,
    travelAgentId,
  );
  return rows[0] || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const lead = await loadLead(params.id, auth.travelAgentId);
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const assignments: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT b.id, b.fleetId, b.startDate, b.endDate, b.bookingType, b.status,
              b.customerName, b.customerPhone, b.pickupLocation, b.dropLocation,
              b.amount, b.notes, b.bookingRefId, b.createdAt,
              f.vehicleName, f.registrationNumber, f.vehicleType, f.coverImage,
              f.brand, f.model, f.seatingCapacity
       FROM travel_agent_fleet_bookings b
       JOIN travel_agent_fleets f ON f.id = b.fleetId
       WHERE b.travelAgentId = ? AND b.bookingRefId = ?
       ORDER BY b.startDate ASC`,
      auth.travelAgentId,
      params.id,
    );

    return NextResponse.json({ assignments });
  } catch (error: any) {
    logger.error('List lead vehicle assignments error', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments', details: error?.message },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const lead = await loadLead(params.id, auth.travelAgentId);
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const body = await request.json();
    const { fleetId, startDate, endDate, amount, notes, status } = body;

    if (!fleetId) return NextResponse.json({ error: 'fleetId is required' }, { status: 400 });

    // Resolve dates: explicit > lead.travelDate / returnDate
    const start =
      parseDate(startDate) ||
      (lead.travelDate ? new Date(lead.travelDate) : null);
    const end =
      parseDate(endDate) ||
      (lead.returnDate ? new Date(lead.returnDate) : null) ||
      start;
    if (!start || !end) {
      return NextResponse.json(
        { error: 'Travel dates required. Provide startDate/endDate or set them on the lead.' },
        { status: 400 },
      );
    }
    // Normalize to whole-day window
    const startNorm = new Date(start);
    startNorm.setHours(0, 0, 0, 0);
    const endNorm = new Date(end);
    endNorm.setHours(23, 59, 59, 999);
    if (endNorm < startNorm) {
      return NextResponse.json({ error: 'endDate must be after startDate' }, { status: 400 });
    }

    // Verify the fleet belongs to this agent
    const fleetRows: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT id, vehicleName FROM travel_agent_fleets WHERE id = ? AND travelAgentId = ? LIMIT 1`,
      fleetId,
      auth.travelAgentId,
    );
    if (!fleetRows.length) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    const stat = ['CONFIRMED', 'TENTATIVE', 'COMPLETED', 'CANCELLED'].includes(status)
      ? status
      : 'CONFIRMED';

    // Conflict check (skip for TENTATIVE)
    if (stat !== 'TENTATIVE') {
      const overlap: any[] = await (prisma as any).$queryRawUnsafe(
        `SELECT id, startDate, endDate, customerName FROM travel_agent_fleet_bookings
         WHERE fleetId = ? AND status <> 'CANCELLED'
           AND startDate <= ? AND endDate >= ?
         LIMIT 1`,
        fleetId,
        endNorm,
        startNorm,
      );
      if (overlap.length) {
        return NextResponse.json(
          {
            error: 'This vehicle is already booked/blocked in the selected date range',
            conflict: overlap[0],
          },
          { status: 409 },
        );
      }
    }

    const id = randomUUID().replace(/-/g, '').slice(0, 25);
    await (prisma as any).$executeRawUnsafe(
      `INSERT INTO travel_agent_fleet_bookings
        (id, travelAgentId, fleetId, startDate, endDate, bookingType, status,
         customerName, customerPhone, pickupLocation, dropLocation, amount,
         bookingRefId, notes, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'CUSTOMER', ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
      id,
      auth.travelAgentId,
      fleetId,
      startNorm,
      endNorm,
      stat,
      lead.customerName || null,
      lead.customerPhone || null,
      lead.pickupLocation || null,
      lead.dropLocation || null,
      amount != null && amount !== '' ? Number(amount) : null,
      params.id,
      notes || `Assigned to lead ${lead.customerName || ''}`.trim(),
    );

    // Auto-note on the lead so the activity timeline reflects it
    try {
      const noteId = randomUUID().replace(/-/g, '').slice(0, 25);
      await (prisma as any).$executeRawUnsafe(
        `INSERT INTO travel_agent_lead_notes (id, leadId, note, authorName, createdAt)
         VALUES (?, ?, ?, ?, NOW(3))`,
        noteId,
        params.id,
        `Vehicle assigned: ${fleetRows[0].vehicleName} (${startNorm.toLocaleDateString('en-IN')} → ${endNorm.toLocaleDateString('en-IN')})`,
        'system',
      );
    } catch (e) {
      // ignore note failure
    }

    const created: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT b.*, f.vehicleName, f.registrationNumber, f.vehicleType, f.coverImage,
              f.brand, f.model, f.seatingCapacity
       FROM travel_agent_fleet_bookings b
       JOIN travel_agent_fleets f ON f.id = b.fleetId
       WHERE b.id = ?`,
      id,
    );
    return NextResponse.json({ assignment: created[0] }, { status: 201 });
  } catch (error: any) {
    logger.error('Assign vehicle to lead error', error);
    return NextResponse.json(
      { error: 'Failed to assign vehicle', details: error?.message },
      { status: 500 },
    );
  }
}
