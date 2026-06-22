// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { prepareNotificationData } from '@/lib/utils/notification-helper';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';

import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
import { creditBackrTokens } from '@/lib/utils/backr-tokens';
import { canCompleteTrip } from '@/lib/utils/booking-date-guard';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
export const dynamic = 'force-dynamic';

// POST - Vendor completes Bus Booking trip
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

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

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

    // Check if trip can be completed
    if (booking.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Can only complete trips that are in progress' },
        { status: 400 }
      );
    }

    // Block completion before return date/time
    const endDate = booking.returnDate || booking.pickupDate;
    const endTime = booking.returnTime || booking.pickupTime;
    const completeCheck = canCompleteTrip(endDate, endTime);
    if (!completeCheck.allowed) {
      return NextResponse.json(
        { error: completeCheck.message },
        { status: 400 }
      );
    }

    // Parse request body for trip details
    const body = await request.json();
    const {
      actualKmTravelled,
      actualDays,
      tollCharges = 0,
      parkingCharges = 0,
      otherCharges = 0,
      otherChargesDescription,
    } = body;

    // Calculate extra charges
    let extraKmCharges = 0;
    let extraDayCharges = 0;

    // Extra day charges if trip took longer
    if (actualDays && actualDays > booking.tripDays) {
      const extraDays = actualDays - booking.tripDays;
      const perDayRate = booking.baseAmount / booking.tripDays;
      extraDayCharges = extraDays * perDayRate;
    }

    // Calculate final amount
    const additionalCharges = extraKmCharges + extraDayCharges + tollCharges + parkingCharges + otherCharges;
    const finalAmount = booking.totalAmount + additionalCharges;
    const newBalanceAmount = finalAmount - booking.advancePaid;

    // Update booking
    const updatedBooking = await prisma.bus_bookings.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        tripEndedAt: new Date(),
        completedAt: new Date(),
        actualKmTravelled: actualKmTravelled || null,
        actualDays: actualDays || booking.tripDays,
        extraKmCharges,
        extraDayCharges,
        tollCharges,
        parkingCharges,
        otherCharges,
        finalAmount,
        balanceAmount: newBalanceAmount,
        vendorNotes: otherChargesDescription
          ? `Other charges: ${otherChargesDescription}`
          : booking.vendorNotes,
      },
    });

    // Send notification to customer
    try {
      const notificationTitle = '✅ Trip Completed!';
      const notificationBody = `Your bus trip has been completed successfully! Booking #${booking.bookingNumber}. ${newBalanceAmount > 0 ? `Balance amount: ₹${newBalanceAmount.toLocaleString()}. ` : ''}Thank you for choosing us!`;

      // Save in-app notification
      await prisma.notifications.create({
        data: prepareNotificationData({
          customerId: booking.customerId,
          title: notificationTitle,
          body: notificationBody,
          type: 'booking',
          serviceType: 'bus',
          bookingId: booking.id,
          quoteId: null,
        }),
      });

      // Send push notification
      await sendNotificationToCustomer(
        booking.customerId,
        {
          title: notificationTitle,
          body: notificationBody,
        },
        {
          type: 'booking',
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          action: 'trip_completed',
        }
      );

      logger.info(`Notification sent for trip completion - Booking: ${booking.bookingNumber}`);
    } catch (notifError) {
      // Log error but don't fail the request
      logger.error('Failed to send trip completion notification', notifError);
    }

    // Notify vendor that trip has been completed
    sendVendorDirectNotification({
      vendorId,
      title: '✅ Trip Completed!',
      body: `Booking #${booking.bookingNumber} bus trip has been completed successfully.${newBalanceAmount > 0 ? ` Balance due: ₹${newBalanceAmount.toLocaleString()}.` : ''}`,
      type: 'trip_completed',
      serviceType: 'bus',
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
    }).catch((err: any) => console.error('[BusComplete] Vendor notify failed:', err));

    // Credit 10% Backr tokens to customer
    creditBackrTokens({
      customerId: booking.customerId,
      bookingAmount: finalAmount,
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      serviceType: 'bus',
    });

    return NextResponse.json({
      success: true,
      message: 'Trip completed successfully',
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        tripEndedAt: updatedBooking.tripEndedAt,
        actualKmTravelled: updatedBooking.actualKmTravelled,
        actualDays: updatedBooking.actualDays,
        extraKmCharges: updatedBooking.extraKmCharges,
        extraDayCharges: updatedBooking.extraDayCharges,
        tollCharges: updatedBooking.tollCharges,
        parkingCharges: updatedBooking.parkingCharges,
        otherCharges: updatedBooking.otherCharges,
        finalAmount: updatedBooking.finalAmount,
        balanceAmount: updatedBooking.balanceAmount,
      },
    });
  } catch (error: any) {
    logger.error('Failed to complete bus booking trip', error);
    return NextResponse.json(
      { error: 'Failed to complete trip', details: error?.message },
      { status: 500 }
    );
  }
}
