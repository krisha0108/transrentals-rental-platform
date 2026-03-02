// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
import logger from '@/lib/security/logger';
import { creditBackrTokens } from '@/lib/utils/backr-tokens';
export const dynamic = 'force-dynamic';

// POST - Vendor completes a bike booking (end trip)
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
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get booking
    const booking = await prisma.bike_bookings.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if this vendor accepted the booking
    if (booking.acceptedVendorId !== vendorId) {
      return NextResponse.json(
        { error: 'You are not authorized to complete this booking' },
        { status: 403 }
      );
    }

    // Check if booking is in progress
    if (booking.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: `Cannot complete booking. Current status: ${booking.status}` },
        { status: 400 }
      );
    }

    // Parse request body for additional info
    const body = await request.json().catch(() => ({}));
    const {
      kmReading,
      damageNotes,
      additionalCharges,
      additionalChargesReason,
      refundSecurityDeposit = true,
    } = body;

    // Calculate final amounts
    let finalAmount = booking.grandTotal;
    if (additionalCharges && additionalCharges > 0) {
      finalAmount = finalAmount + additionalCharges;
    }

    // Update booking to completed
    const updatedBooking = await prisma.bike_bookings.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        returnedAt: new Date(),
        actualReturnDate: new Date(),
        tripEndVerifiedAt: new Date(),
        // Add damage notes if provided
        ...(damageNotes && {
          customerNotes: booking.customerNotes
            ? `${booking.customerNotes}\n\nDamage Notes: ${damageNotes}`
            : `Damage Notes: ${damageNotes}`
        }),
        // Add damage charges if provided
        ...(additionalCharges && additionalCharges > 0 && { damageCharges: additionalCharges }),
      },
    });

    // Credit 10% Backr tokens to customer
    creditBackrTokens({
      customerId: booking.customerId,
      bookingAmount: booking.grandTotal,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      serviceType: 'bike',
    });

    // Notify vendor that trip has been completed
    sendVendorDirectNotification({
      vendorId,
      title: '✅ Trip Completed!',
      body: `Bike booking #${updatedBooking.bookingNumber} has been completed successfully.`,
      type: 'trip_completed',
      serviceType: 'bike',
      bookingId: id,
      bookingNumber: updatedBooking.bookingNumber,
    }).catch((err: any) => logger.error('[BikeComplete] Vendor notify failed:', err));

    return NextResponse.json({
      success: true,
      message: 'Booking completed successfully!',
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        completedAt: updatedBooking.returnedAt,
        grandTotal: updatedBooking.grandTotal,
      },
    });
  } catch (error: any) {
    logger.error('Failed to complete bike booking', error);
    return NextResponse.json(
      { error: 'Failed to complete booking', details: error?.message },
      { status: 500 }
    );
  }
}
