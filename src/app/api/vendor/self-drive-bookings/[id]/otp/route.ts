// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
export const dynamic = 'force-dynamic';

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// GET - Vendor generates OTP for car pickup
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

    // Check if booking is accepted or confirmed
    if (booking.status !== 'ACCEPTED' && booking.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Booking must be in ACCEPTED or CONFIRMED status to generate OTP' },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update booking with OTP
    const updatedBooking = await prisma.car_bookings.update({
      where: { id },
      data: {
        tripStartOtp: otp,
        tripStartOtpExpiry: otpExpiry,
        tripStartOtpSentAt: new Date(),
        status: 'READY_FOR_PICKUP',
      },
    });

    // Send OTP notification to customer
    try {
      const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
      await prisma.notifications.create({
        data: {
          id: notificationId,
          customerId: booking.customerId,
          title: '🔑 Trip Start OTP',
          body: `Your OTP for car pickup is: ${otp}. Valid for 15 minutes.`,
          type: 'booking',
          serviceType: 'self-drive',
          bookingId: booking.id,
          isRead: false,
        },
      });
      console.log('✅ Self-drive OTP in-app notification created:', notificationId);

      console.log('📤 Sending self-drive OTP push notification to customer:', booking.customerId);
      const pushResult = await sendNotificationToCustomer(
        booking.customerId,
        {
          title: '🔑 Trip Start OTP',
          body: `Your OTP for car pickup is: ${otp}. Valid for 15 minutes.`,
        },
        {
          type: 'otp',
          serviceType: 'self-drive',
          bookingId: booking.id,
          otp: otp,
          expiresAt: otpExpiry.toISOString(),
        }
      );

      if (pushResult.success) {
        console.log('✅ Self-drive OTP push notification sent successfully:', pushResult.messageId);
      } else {
        console.error('❌ Self-drive OTP push notification failed:', pushResult.error);
      }
    } catch (notificationError: any) {
      console.error('❌ Self-drive OTP notification error:', notificationError);
      logger.error('Failed to send self-drive OTP notification', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP generated and sent to customer',
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        customerPhone: updatedBooking.customerPhone,
        otpExpiry: otpExpiry,
      },
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });
  } catch (error: any) {
    logger.error('OTP generation error', error);
    return NextResponse.json(
      { error: 'Failed to generate OTP', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Vendor verifies OTP and starts trip
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

    const body = await request.json();
    const { otp, odometerStart } = body;

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

    // Check if booking is ready for pickup
    if (booking.status !== 'READY_FOR_PICKUP') {
      return NextResponse.json(
        { error: 'Booking is not ready for pickup' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (!otp) {
      return NextResponse.json(
        { error: 'OTP is required' },
        { status: 400 }
      );
    }

    if (booking.tripStartOtp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }

    // Check OTP expiry
    if (booking.tripStartOtpExpiry && new Date() > booking.tripStartOtpExpiry) {
      return NextResponse.json(
        { error: 'OTP has expired. Please generate a new OTP.' },
        { status: 400 }
      );
    }

    // OTP verified - start trip
    const updatedBooking = await prisma.car_bookings.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        tripOtpVerified: true,
        tripOtpVerifiedAt: new Date(),
        pickedUpAt: new Date(),
        odometerStart: odometerStart || null,
        tripStartOtp: null, // Clear OTP after use
        tripStartOtpExpiry: null,
      },
    });

    // Send trip started notification
    try {
      const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
      await prisma.notifications.create({
        data: {
          id: notificationId,
          customerId: booking.customerId,
          title: '🚗 Trip Started!',
          body: `Your self-drive car rental has started! Enjoy your ride and drive safe! 🛣️`,
          type: 'booking',
          serviceType: 'self-drive',
          bookingId: booking.id,
          isRead: false,
        },
      });
      console.log('✅ Self-drive trip started in-app notification created:', notificationId);

      console.log('📤 Sending self-drive trip started push notification to customer:', booking.customerId);
      const pushResult = await sendNotificationToCustomer(
        booking.customerId,
        {
          title: '🚗 Trip Started!',
          body: `Your self-drive car rental has started! Enjoy your ride and drive safe! 🛣️`,
        },
        {
          type: 'trip_started',
          serviceType: 'self-drive',
          bookingId: booking.id,
          bookingNumber: updatedBooking.bookingNumber || '',
        }
      );

      if (pushResult.success) {
        console.log('✅ Self-drive trip started push notification sent successfully:', pushResult.messageId);
      } else {
        console.error('❌ Self-drive trip started push notification failed:', pushResult.error);
      }
    } catch (notificationError: any) {
      console.error('❌ Self-drive trip started notification error:', notificationError);
      logger.error('Failed to send self-drive trip started notification', notificationError);
    }

    // Notify vendor that trip has started
    sendVendorDirectNotification({
      vendorId,
      title: '🚗 Trip Started!',
      body: `Booking #${updatedBooking.bookingNumber} self-drive trip has been started successfully.`,
      type: 'trip_started',
      serviceType: 'self-drive',
      bookingId: booking.id,
      bookingNumber: updatedBooking.bookingNumber,
    }).catch((err: any) => console.error('[SelfDriveStart] Vendor notify failed:', err));

    return NextResponse.json({
      success: true,
      message: 'OTP verified. Trip started successfully!',
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        pickedUpAt: updatedBooking.pickedUpAt,
        odometerStart: updatedBooking.odometerStart,
      },
    });
  } catch (error: any) {
    logger.error('OTP verification error', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP', details: error?.message },
      { status: 500 }
    );
  }
}
