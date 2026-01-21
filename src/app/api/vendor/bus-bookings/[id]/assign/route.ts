// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate OTP
function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// POST - Vendor assigns vehicle and driver to Bus Booking
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

    // Check if booking can have vehicle assigned
    if (!['ADVANCE_PAID', 'CONFIRMED'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'Vehicle can only be assigned after advance payment or confirmation' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      vehicleNumber,
      vehicle_model,
      driverName,
      driverPhone,
      driverPhoto,
      assignedVehicleId,
    } = body;

    // Validate required fields
    if (!vehicleNumber || !driverName || !driverPhone) {
      return NextResponse.json(
        { error: 'Vehicle number, driver name, and driver phone are required' },
        { status: 400 }
      );
    }

    // Update booking with vehicle and driver details
    const updatedBooking = await prisma.bus_bookings.update({
      where: { id },
      data: {
        status: 'VEHICLE_ASSIGNED',
        assignedVehicleId: assignedVehicleId || null,
        vehicleNumber,
        vehicleModel: vehicle_model || null,
        driverName,
        driverPhone,
        driverPhoto: driverPhoto || null,
        // OTPs are now driver-initiated, so we clear/null them here
        tripStartOtp: null,
        tripEndOtp: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Vehicle and driver assigned successfully',
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        vehicleNumber: updatedBooking.vehicleNumber,
        vehicleModel: updatedBooking.vehicleModel,
        driverName: updatedBooking.driverName,
        driverPhone: updatedBooking.driverPhone,
      },
    });
  } catch (error: any) {
    logger.error('Failed to assign vehicle to bus booking', error);
    return NextResponse.json(
      { error: 'Failed to assign vehicle', details: error?.message },
      { status: 500 }
    );
  }
}
