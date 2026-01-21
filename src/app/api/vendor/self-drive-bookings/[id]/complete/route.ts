// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// POST - Vendor completes the car rental trip
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
    const booking = await prisma.car_bookings.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if this vendor accepted the booking
    if (booking.acceptedVendorId !== vendorId) {
      return NextResponse.json(
        { error: 'You are not authorized for this booking' },
        { status: 403 }
      );
    }

    // Check if booking is in progress
    if (booking.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Trip must be in progress to complete' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const {
      odometerEnd,
      damageNotes,
      additionalCharges,
      additionalChargesReason,
      returnFuelLevel,
      refundSecurityDeposit = true,
    } = body;

    // Calculate extra km charges if applicable
    let extraKmCharges = 0;
    if (odometerEnd && booking.odometerStart) {
      const totalKm = odometerEnd - booking.odometerStart;
      const allowedKm = booking.kmLimitPerDay * booking.totalDays;
      if (totalKm > allowedKm) {
        extraKmCharges = (totalKm - allowedKm) * booking.extraKmRate;
      }
    }

    // Build update data
    const updateData: any = {
      status: 'COMPLETED',
      returnedAt: new Date(),
      completedAt: new Date(),
      odometerEnd: odometerEnd || null,
      extraKmCharges,
      returnFuelLevel: returnFuelLevel || null,
      paymentStatus: 'PAID',
    };

    // Add damage notes if provided
    if (damageNotes) {
      updateData.vendorNotes = booking.vendorNotes
        ? `${booking.vendorNotes}\n\nDamage Notes: ${damageNotes}`
        : `Damage Notes: ${damageNotes}`;
    }

    // Add additional charges if provided
    if (additionalCharges && additionalCharges > 0) {
      updateData.extraKmCharges = (extraKmCharges || 0) + additionalCharges;
      if (additionalChargesReason) {
        updateData.vendorNotes = updateData.vendorNotes
          ? `${updateData.vendorNotes}\nAdditional Charges (${additionalCharges}): ${additionalChargesReason}`
          : `Additional Charges (${additionalCharges}): ${additionalChargesReason}`;
      }
    }

    // Update booking
    const updatedBooking = await prisma.car_bookings.update({
      where: { id },
      data: updateData,
      include: {
        locations: { select: { name: true, slug: true } },
      },
    });

    // Calculate total km driven
    const totalKmDriven = odometerEnd && booking.odometerStart
      ? odometerEnd - booking.odometerStart
      : null;

    return NextResponse.json({
      success: true,
      message: 'Trip completed successfully!',
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        returnedAt: updatedBooking.returnedAt,
        completedAt: updatedBooking.completedAt,
        odometerStart: updatedBooking.odometerStart,
        odometerEnd: updatedBooking.odometerEnd,
        totalKmDriven,
        allowedKm: booking.kmLimitPerDay * booking.totalDays,
        extraKmCharges: updatedBooking.extraKmCharges,
        grandTotal: updatedBooking.grandTotal,
        securityDeposit: updatedBooking.securityDeposit,
        refundSecurityDeposit,
      },
    });
  } catch (error: any) {
    logger.error('Trip completion error', error);
    return NextResponse.json(
      { error: 'Failed to complete trip', details: error?.message },
      { status: 500 }
    );
  }
}
