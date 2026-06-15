// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
import { canStartTrip, canCompleteTrip } from '@/lib/utils/booking-date-guard';
export const dynamic = 'force-dynamic';

// POST - Vendor approves/rejects booking or verifies payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guard = await vendorStatusGuard(auth.vendorId!);
    if (guard.blocked) return guard.response;

    const resolvedParams = 'then' in params ? await params : params;
    const { id: bookingId } = resolvedParams;
    const body = await request.json();
    const { action, reason, vehicleId } = body;

    // Valid actions: verify_payment, approve, reject, start_trip, complete_trip
    const validActions = ['verify_payment', 'approve', 'reject', 'start_trip', 'complete_trip'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: ' + validActions.join(', ') },
        { status: 400 }
      );
    }

    // Find the booking
    const booking = await prisma.bike_bookings.findUnique({
      where: { id: bookingId },
      include: {
        acceptedVendor: true,
        customer: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if vendor owns this booking (if assigned)
    // For now, we'll allow any vendor to approve broadcasted bookings
    // TODO: Add proper vendor validation based on your business logic

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'verify_payment':
        // Vendor verifies customer's payment
        if (booking.status !== 'PAYMENT_SUBMITTED') {
          return NextResponse.json(
            { error: 'Booking payment is not pending verification' },
            { status: 400 }
          );
        }
        updateData = {
          status: 'PAYMENT_VERIFIED',
          advancePaymentVerified: true,
          advanceVerifiedBy: auth.vendorId,
          advanceVerifiedAt: new Date(),
          paymentStatus: 'PAID',
        };
        message = 'Payment verified successfully';
        break;

      case 'approve':
        // Vendor approves the booking (after payment verification)
        const allowedForApproval = ['PAYMENT_VERIFIED', 'BROADCASTED', 'PENDING_VENDOR'];
        if (!allowedForApproval.includes(booking.status)) {
          return NextResponse.json(
            { error: `Cannot approve booking with status: ${booking.status}` },
            { status: 400 }
          );
        }
        updateData = {
          status: 'ACCEPTED',
          vendorId: auth.vendorId,
          acceptedAt: new Date(),
          // Assign specific vehicle if provided
          ...(vehicleId && { assignedVehicleId: vehicleId }),
        };
        message = 'Booking approved successfully';
        break;

      case 'reject':
        // Vendor rejects the booking
        updateData = {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: auth.vendorId,
          cancellationReason: reason || 'Rejected by vendor',
        };
        message = 'Booking rejected';
        break;

      case 'start_trip':
        // This is handled by OTP verification, but can be manual override
        if (booking.status !== 'READY_FOR_PICKUP' && booking.status !== 'ACCEPTED') {
          return NextResponse.json(
            { error: 'Booking is not ready to start trip' },
            { status: 400 }
          );
        }
        // Block trip start before pickup date/time
        {
          const startCheck = canStartTrip(booking.pickupDate, booking.pickupTime);
          if (!startCheck.allowed) {
            return NextResponse.json({ error: startCheck.message }, { status: 400 });
          }
        }
        updateData = {
          status: 'IN_PROGRESS',
          tripStartedAt: new Date(),
        };
        message = 'Trip started successfully';
        break;

      case 'complete_trip':
        // Vendor marks trip as complete
        if (booking.status !== 'IN_PROGRESS') {
          return NextResponse.json(
            { error: 'Cannot complete a trip that is not in progress' },
            { status: 400 }
          );
        }
        // Block completion before drop date/time
        {
          const completeCheck = canCompleteTrip(booking.dropDate, booking.dropTime);
          if (!completeCheck.allowed) {
            return NextResponse.json({ error: completeCheck.message }, { status: 400 });
          }
        }
        updateData = {
          status: 'COMPLETED',
          actualReturnDate: new Date(),
          completedAt: new Date(),
        };
        message = 'Trip completed successfully';
        break;
    }

    // Update the booking
    const updatedBooking = await prisma.bike_bookings.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        acceptedVendor: {
          select: { id: true, businessName: true, phone: true },
        },
      },
    });

    // TODO: Send notifications based on action
    // - verify_payment: Notify customer payment verified
    // - approve: Notify customer booking approved
    // - reject: Notify customer booking rejected with reason
    // - start_trip: Notify customer trip started
    // - complete_trip: Notify customer trip completed

    return NextResponse.json({
      success: true,
      message,
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        customer: updatedBooking.customer,
        vendor: updatedBooking.acceptedVendor,
      },
    });
  } catch (error: any) {
    logger.error('Booking approval error', error);
    return NextResponse.json(
      { error: 'Failed to process booking action', details: error?.message },
      { status: 500 }
    );
  }
}
