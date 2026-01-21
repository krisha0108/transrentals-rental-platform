// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// POST - Vendor accepts a Self-Drive car booking
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
      select: {
        id: true,
        businessName: true,
        phone: true,
        vendor_approved_locations: { select: { locationId: true } },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const approvedLocationIds = vendor.vendor_approved_locations.map((l) => l.locationId);

    // Get booking
    const booking = await prisma.car_bookings.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if booking can be accepted
    if (!['PENDING_VENDOR', 'BROADCASTED'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'This booking cannot be accepted' },
        { status: 400 }
      );
    }

    // For direct requests, only the assigned vendor can accept
    if (booking.status === 'PENDING_VENDOR' && booking.assignedVendorId !== vendorId) {
      return NextResponse.json(
        { error: 'You are not authorized to accept this booking' },
        { status: 403 }
      );
    }

    // For broadcasted requests, check if vendor has approved location
    if (booking.status === 'BROADCASTED' && !approvedLocationIds.includes(booking.locationId)) {
      return NextResponse.json(
        { error: 'This booking is not available in your approved locations' },
        { status: 403 }
      );
    }

    // Parse request body for additional info (vehicle assignment, custom rate)
    const body = await request.json().catch(() => ({}));
    const { vehicleId, vehicleName, customRate } = body;

    // Calculate new amounts if custom rate provided
    let updateData: any = {
      status: 'ACCEPTED',
      acceptedVendorId: vendorId,
      assignedVehicleId: vehicleId || null,
      assignedVehicleName: vehicleName || booking.requestedVehicleName,
      acceptedAt: new Date(),
      responseDeadline: null, // Clear deadline after acceptance
    };

    if (customRate && customRate !== booking.dailyRate) {
      const baseAmount = customRate * booking.totalDays;
      const gstAmount = Math.round(baseAmount * 0.18);
      const platformFee = booking.platformFee || 99;
      const grandTotal = baseAmount + gstAmount + platformFee;

      updateData = {
        ...updateData,
        dailyRate: customRate,
        baseAmount,
        gstAmount,
        grandTotal,
      };
    }

    // Use optimistic locking to prevent race conditions
    // (multiple vendors accepting the same booking)
    const result = await prisma.car_bookings.updateMany({
      where: {
        id,
        status: { in: ['PENDING_VENDOR', 'BROADCASTED'] },
        version: booking.version, // OPTIMISTIC LOCKING
      },
      data: {
        ...updateData,
        version: { increment: 1 }, // Increment version
      },
    });

    // If count is 0, another vendor already accepted
    if (result.count === 0) {
      return NextResponse.json(
        {
          error: 'Booking already taken',
          message: 'Another vendor has already accepted this booking.',
        },
        { status: 409 } // Conflict
      );
    }

    // Fetch the updated booking for response
    const updatedBooking = await prisma.car_bookings.findUnique({
      where: { id },
      include: {
        locations: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Self-Drive booking accepted successfully',
      booking: {
        id: updatedBooking?.id,
        bookingNumber: updatedBooking?.bookingNumber,
        status: updatedBooking?.status,
        vehicleName: updatedBooking?.assignedVehicleName,
        dailyRate: updatedBooking?.dailyRate,
        baseAmount: updatedBooking?.baseAmount,
        grandTotal: updatedBooking?.grandTotal,
        acceptedAt: updatedBooking?.acceptedAt,
        location: updatedBooking?.locations,
      },
    });
  } catch (error: any) {
    logger.error('Failed to accept car booking', error);
    return NextResponse.json(
      { error: 'Failed to accept booking', details: error?.message },
      { status: 500 }
    );
  }
}
