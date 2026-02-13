// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// GET - Generate and send OTP for car pickup
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find booking
    const booking = await prisma.car_bookings.findUnique({
      where: { id },
    });

    if (!booking) {
      // Try by booking number
      const bookingByNumber = await prisma.car_bookings.findUnique({
        where: { bookingNumber: id },
      });

      if (!bookingByNumber) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      return generateAndSendOTP(bookingByNumber);
    }

    return generateAndSendOTP(booking);
  } catch (error: any) {
    logger.error('OTP generation error', error);
    return NextResponse.json(
      { error: 'Failed to generate OTP', details: error?.message },
      { status: 500 }
    );
  }
}

async function generateAndSendOTP(booking: any) {
  // Check if booking is accepted
  if (booking.status !== 'ACCEPTED') {
    return NextResponse.json(
      { error: 'Booking must be accepted before generating OTP' },
      { status: 400 }
    );
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

  // Update booking with OTP
  const updatedBooking = await prisma.car_bookings.update({
    where: { id: booking.id },
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
    status: updatedBooking.status,
    otpExpiry: otpExpiry,
    // In development, return OTP for testing
    ...(process.env.NODE_ENV === 'development' && { otp }),
  });
}

// POST - Verify OTP and start trip / complete trip
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, otp, odometerStart, odometerEnd, damageNotes, additionalCharges } = body;

    // Find booking
    let booking = await prisma.car_bookings.findUnique({
      where: { id },
    });

    if (!booking) {
      booking = await prisma.car_bookings.findUnique({
        where: { bookingNumber: id },
      });
    }

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Start Trip - Verify OTP
    if (action === 'start') {
      if (booking.status !== 'READY_FOR_PICKUP') {
        return NextResponse.json(
          { error: 'Booking is not ready for pickup' },
          { status: 400 }
        );
      }

      // Check OTP
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
        where: { id: booking.id },
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

      return NextResponse.json({
        success: true,
        message: 'Trip started successfully',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          pickedUpAt: updatedBooking.pickedUpAt,
          odometerStart: updatedBooking.odometerStart,
        },
      });
    }

    // Complete Trip
    if (action === 'complete') {
      if (booking.status !== 'IN_PROGRESS') {
        return NextResponse.json(
          { error: 'Trip must be in progress to complete' },
          { status: 400 }
        );
      }

      // Calculate extra km charges if applicable
      let extraKmCharges = 0;
      if (odometerEnd && booking.odometerStart) {
        const totalKm = odometerEnd - booking.odometerStart;
        const allowedKm = booking.kmLimitPerDay * booking.totalDays;
        if (totalKm > allowedKm) {
          extraKmCharges = (totalKm - allowedKm) * booking.extraKmRate;
        }
      }

      // Update booking
      const updateData: any = {
        status: 'COMPLETED',
        returnedAt: new Date(),
        completedAt: new Date(),
        odometerEnd: odometerEnd || null,
        extraKmCharges,
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
      }

      const updatedBooking = await prisma.car_bookings.update({
        where: { id: booking.id },
        data: updateData,
      });

      // Send trip completion notification
      try {
        const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
        await prisma.notifications.create({
          data: {
            id: notificationId,
            customerId: booking.customerId,
            title: '🎉 Trip Completed Successfully!',
            body: `Your self-drive rental is complete! Hope you enjoyed the journey! 🚗 Book again for your next trip! ✨`,
            type: 'booking',
            serviceType: 'self-drive',
            bookingId: booking.id,
            isRead: false,
          },
        });
        console.log('✅ Self-drive trip completed in-app notification created:', notificationId);

        console.log('📤 Sending self-drive trip completed push notification to customer:', booking.customerId);
        const pushResult = await sendNotificationToCustomer(
          booking.customerId,
          {
            title: '🎉 Trip Completed Successfully!',
            body: `Your self-drive rental is complete! Hope you enjoyed the journey! 🚗 Book again for your next trip! ✨`,
          },
          {
            type: 'trip_completed',
            serviceType: 'self-drive',
            bookingId: booking.id,
            bookingNumber: updatedBooking.bookingNumber || '',
          }
        );

        if (pushResult.success) {
          console.log('✅ Self-drive trip completed push notification sent successfully:', pushResult.messageId);
        } else {
          console.error('❌ Self-drive trip completed push notification failed:', pushResult.error);
        }
      } catch (notificationError: any) {
        console.error('❌ Self-drive trip completed notification error:', notificationError);
        logger.error('Failed to send self-drive trip completed notification', notificationError);
      }

      return NextResponse.json({
        success: true,
        message: 'Trip completed successfully',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          returnedAt: updatedBooking.returnedAt,
          odometerEnd: updatedBooking.odometerEnd,
          extraKmCharges: updatedBooking.extraKmCharges,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "start" or "complete".' },
      { status: 400 }
    );
  } catch (error: any) {
    logger.error('OTP verification error', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error?.message },
      { status: 500 }
    );
  }
}
