// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { checkFleetAvailability } from '@/lib/utils/fleet-availability';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Check if vehicle is available for given dates
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

    // Verify vendor owns this fleet vehicle
    const vehicle = await prisma.vendor_fleets.findFirst({
      where: { id, vendorId: auth.vendorId },
      select: { id: true, isAvailable: true, isActive: true },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const startStr = searchParams.get('startDate');
    const endStr = searchParams.get('endDate');
    const excludeBookingId = searchParams.get('excludeBookingId') || undefined;

    if (!startStr || !endStr) {
      return NextResponse.json(
        { error: 'startDate and endDate query parameters are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    // Check manual kill switch first
    if (!vehicle.isAvailable || !vehicle.isActive) {
      return NextResponse.json({
        success: true,
        available: false,
        reason: !vehicle.isActive ? 'Vehicle is deactivated' : 'Vehicle is marked unavailable',
        conflicts: [],
      });
    }

    // Check date-based availability
    const result = await checkFleetAvailability(id, startDate, endDate, excludeBookingId);

    return NextResponse.json({
      success: true,
      available: result.available,
      conflicts: result.conflicts,
    });
  } catch (error: any) {
    logger.error('Failed to check fleet availability', error);
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
  }
}
