// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// POST - Vendor starts Bus Booking trip (with OTP verification)
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
      select: { id: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get booking
    const booking = await prisma.bus_bookings.findUnique({
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

    // Check if trip can be started
    if (booking.status !== 'VEHICLE_ASSIGNED') {
      return NextResponse.json(
        { error: 'Trip can only be started when vehicle is assigned' },
        { status: 400 }
      );
    }

    // Parse request body for OTP
    const body = await request.json();
    const { otp } = body;

    // Verify OTP
    if (!otp) {
      return NextResponse.json(
        { error: 'OTP is required to start the trip' },
        { status: 400 }
      );
    }

    if (otp !== booking.tripStartOtp) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Update booking to start trip
    const updatedBooking = await prisma.bus_bookings.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        tripStartedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Trip started successfully',
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        tripStartedAt: updatedBooking.tripStartedAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to start bus booking trip', error);
    return NextResponse.json(
      { error: 'Failed to start trip', details: error?.message },
      { status: 500 }
    );
  }
}
