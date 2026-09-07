// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { getBlockedDatesForFleet, blockDatesManually } from '@/lib/utils/fleet-availability';
import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

// GET - Returns blocked dates for a fleet vehicle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;


    // Verify vendor owns this fleet vehicle
    const vehicle = await prisma.vendor_fleets.findFirst({
      where: { id, vendorId: vendorId },
      select: { id: true },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Optional date range filter from query params
    const { searchParams } = new URL(request.url);
    const startStr = searchParams.get('startDate');
    const endStr = searchParams.get('endDate');

    const startDate = startStr ? new Date(startStr) : undefined;
    const endDate = endStr ? new Date(endStr) : undefined;

    const blockedDates = await getBlockedDatesForFleet(id, startDate, endDate);

    return NextResponse.json({ success: true, blockedDates });
  } catch (error: any) {
    logger.error('Failed to fetch blocked dates', error);
    return NextResponse.json({ error: 'Failed to fetch blocked dates' }, { status: 500 });
  }
}

// POST - Vendor manually blocks dates (maintenance, etc.)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId, { allowSuspended: true });
    if (guard.blocked) return guard.response;

    // Verify vendor owns this fleet vehicle
    const vehicle = await prisma.vendor_fleets.findFirst({
      where: { id, vendorId: vendorId },
      select: { id: true },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    const body = await request.json();
    const { startDate, endDate, notes } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      return NextResponse.json(
        { error: 'endDate must be after or equal to startDate' },
        { status: 400 }
      );
    }

    const blockedDate = await blockDatesManually(id, start, end, vendorId, notes);

    return NextResponse.json({
      success: true,
      message: 'Dates blocked successfully',
      blockedDate,
    });
  } catch (error: any) {
    logger.error('Failed to block dates', error);
    return NextResponse.json({ error: 'Failed to block dates' }, { status: 500 });
  }
}

// DELETE - Remove a manual block (cannot remove BOOKING blocks)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId, { allowSuspended: true });
    if (guard.blocked) return guard.response;

    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('blockId');

    if (!blockId) {
      return NextResponse.json({ error: 'blockId query parameter is required' }, { status: 400 });
    }

    // Find the blocked date record
    const blockedDate = await prisma.vendor_fleet_blocked_dates.findFirst({
      where: {
        id: blockId,
        vendorFleetId: id,
        isActive: true,
      },
      include: {
        vendor_fleets: { select: { vendorId: true } },
      },
    });

    if (!blockedDate) {
      return NextResponse.json({ error: 'Blocked date not found' }, { status: 404 });
    }

    // Verify vendor owns this vehicle
    if (blockedDate.vendor_fleets.vendorId !== vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Cannot remove BOOKING blocks
    if (blockedDate.reason === 'BOOKING') {
      return NextResponse.json(
        { error: 'Cannot remove booking-based blocks. Cancel the booking instead.' },
        { status: 400 }
      );
    }

    // Soft-delete
    await prisma.vendor_fleet_blocked_dates.update({
      where: { id: blockId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: 'Block removed successfully' });
  } catch (error: any) {
    logger.error('Failed to remove blocked dates', error);
    return NextResponse.json({ error: 'Failed to remove block' }, { status: 500 });
  }
}
