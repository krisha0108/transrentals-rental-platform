// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// POST - Vendor assigns team to Packers & Movers Booking
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
    const vendorId = auth.vendorId;

    // Get vendor
    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: { id: true, businessName: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get booking
    const booking = await prisma.packers_bookings.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify vendor owns this booking
    if (booking.vendorId !== vendorId) {
      return NextResponse.json(
        { error: 'You are not authorized to update this booking' },
        { status: 403 }
      );
    }

    // Check if booking can have team assigned/updated
    const allowedStatuses = ['ADVANCE_PAID', 'CONFIRMED', 'TEAM_ASSIGNED'];
    if (!allowedStatuses.includes(booking.status)) {
      return NextResponse.json(
        { error: 'Team can only be assigned after advance payment or confirmation' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      vehicleNumber,
      vehicleNumbers,
      teamLeaderName,
      teamLeaderPhone,
    } = body;

    // Validate required fields
    if (!teamLeaderName || !teamLeaderPhone) {
      return NextResponse.json(
        { error: 'Team leader name and phone are required' },
        { status: 400 }
      );
    }

    // Update booking with team details
    const updatedBooking = await prisma.packers_bookings.update({
      where: { id },
      data: {
        status: 'TEAM_ASSIGNED',
        vehicleNumbers: vehicleNumbers || vehicleNumber || null,
        teamLeaderName,
        teamLeaderPhone,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Team assigned successfully',
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        vehicleNumbers: updatedBooking.vehicleNumbers,
        teamLeaderName: updatedBooking.teamLeaderName,
        teamLeaderPhone: updatedBooking.teamLeaderPhone,
      },
    });
  } catch (error: any) {
    logger.error('Failed to assign team to packers booking', error);
    return NextResponse.json(
      { error: 'Failed to assign team', details: error?.message },
      { status: 500 }
    );
  }
}
