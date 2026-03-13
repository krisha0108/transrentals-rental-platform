// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { prepareNotificationData } from '@/lib/utils/notification-helper';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';

import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
import { canStartTrip } from '@/lib/utils/booking-date-guard';
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

    // Block trip start before pickup date/time
    const startCheck = canStartTrip(booking.pickupDate, booking.pickupTime);
    if (!startCheck.allowed) {
      return NextResponse.json(
        { error: startCheck.message },
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

    // Send notification to customer
    try {
      const notificationTitle = '🚀 Trip Started!';
      const notificationBody = `Your bus trip has started! Booking #${booking.bookingNumber}. Driver ${booking.driverName} is on the way. Have a safe journey!`;

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
          action: 'trip_started',
        }
      );

      logger.info(`Notification sent for trip start - Booking: ${booking.bookingNumber}`);
    } catch (notifError) {
      // Log error but don't fail the request
      logger.error('Failed to send trip start notification', notifError);
    }

    // Notify vendor that trip has started
    sendVendorDirectNotification({
      vendorId,
      title: '🚀 Trip Started!',
      body: `Booking #${booking.bookingNumber} bus trip has been started successfully.`,
      type: 'trip_started',
      serviceType: 'bus',
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
    }).catch((err: any) => console.error('[BusStart] Vendor notify failed:', err));

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
