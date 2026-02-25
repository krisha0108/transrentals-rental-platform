import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { sendNotificationToCustomer } from '@/lib/services/push-notification-service';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
export const dynamic = 'force-dynamic';

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// GET - Generate and send OTP to customer for trip start
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Support both web session and mobile JWT authentication
    const vendorAuth = await getVendorAuth(request);
    if (!vendorAuth.authenticated || !vendorAuth.vendorId) {
      return NextResponse.json({ error: vendorAuth.error || 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id: bookingId } = resolvedParams;

    // Find the booking
    const booking = await prisma.bike_bookings.findUnique({
      where: { id: bookingId },
      include: {
        customers: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify that this vendor is authorized for this booking
    // acceptedVendorId is set after explicit accept; assignedVendorId is set in quote flow (PAYMENT_VERIFIED)
    const isAuthorized = booking.acceptedVendorId === vendorAuth.vendorId || booking.assignedVendorId === vendorAuth.vendorId;
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'You are not authorized to generate OTP for this booking' },
        { status: 403 }
      );
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    // Check booking status to determine OTP type
    if (booking.status === 'IN_PROGRESS') {
      // Generate TRIP END OTP
      await prisma.bike_bookings.update({
        where: { id: bookingId },
        data: {
          tripEndOtp: otp,
          tripEndOtpExpiry: otpExpiry,
          tripEndOtpSentAt: new Date(),
        },
      });

      // Send trip end OTP notification
      try {
        const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
        await prisma.notifications.create({
          data: {
            id: notificationId,
            customerId: booking.customerId,
            title: '🔑 Trip End OTP',
            body: `Your OTP for bike return is: ${otp}. Valid for 15 minutes.`,
            type: 'booking',
            serviceType: 'bike-on-rent',
            bookingId: bookingId,
            isRead: false,
          },
        });
        console.log('✅ Trip end in-app notification created:', notificationId);

        console.log('📤 Sending trip end OTP push notification to customer:', booking.customerId);
        const pushResult = await sendNotificationToCustomer(
          booking.customerId,
          {
            title: '🔑 Trip End OTP',
            body: `Your OTP for bike return is: ${otp}. Valid for 15 minutes.`,
          },
          {
            type: 'trip_end_otp',
            serviceType: 'bike-on-rent',
            bookingId: bookingId,
            otp: otp,
            expiresAt: otpExpiry.toISOString(),
          }
        );

        if (pushResult.success) {
          console.log('✅ Trip end OTP push notification sent successfully:', pushResult.messageId);
        } else {
          console.error('❌ Trip end OTP push notification failed:', pushResult.error);
        }
      } catch (notificationError: any) {
        console.error('❌ Trip end OTP notification error:', notificationError);
      }

      return NextResponse.json({
        success: true,
        message: 'Trip end OTP sent to customer successfully',
        otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        expiresAt: otpExpiry,
        type: 'end',
        customer: {
          name: booking.customers?.name,
          phone: booking.customers?.phone ? `****${booking.customers.phone.slice(-4)}` : null,
        },
      });
    }

    // Check if booking is ready for trip start (vendor approved or payment verified)
    const allowedStatuses = ['PAYMENT_VERIFIED', 'ACCEPTED', 'CONFIRMED', 'READY_FOR_PICKUP'];
    if (!allowedStatuses.includes(booking.status)) {
      return NextResponse.json(
        { error: 'Booking is not ready to start or end trip. Current status: ' + booking.status },
        { status: 400 }
      );
    }

    // Generate TRIP START OTP
    await prisma.bike_bookings.update({
      where: { id: bookingId },
      data: {
        tripStartOtp: otp,
        tripStartOtpExpiry: otpExpiry,
        tripStartOtpSentAt: new Date(),
        status: 'READY_FOR_PICKUP',
        // Set acceptedVendorId for quote-flow bookings where only assignedVendorId was set
        acceptedVendorId: booking.acceptedVendorId ?? vendorAuth.vendorId,
      },
    });

    // Send OTP notification to customer
    try {
      // Create in-app notification
      const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
      await prisma.notifications.create({
        data: {
          id: notificationId,
          customerId: booking.customerId,
          title: '🔑 Trip Start OTP',
          body: `Your OTP for bike pickup is: ${otp}. Valid for 15 minutes.`,
          type: 'booking',
          serviceType: 'bike-on-rent',
          bookingId: bookingId,
          isRead: false,
        },
      });
      console.log('✅ In-app notification created:', notificationId);

      // Send push notification
      console.log('📤 Sending push notification to customer:', booking.customerId);
      const pushResult = await sendNotificationToCustomer(
        booking.customerId,
        {
          title: '🔑 Trip Start OTP',
          body: `Your OTP for bike pickup is: ${otp}. Valid for 15 minutes.`,
        },
        {
          type: 'otp',
          serviceType: 'bike-on-rent',
          bookingId: bookingId,
          otp: otp,
          expiresAt: otpExpiry.toISOString(),
        }
      );

      if (pushResult.success) {
        console.log('✅ Push notification sent successfully:', pushResult.messageId);
      } else {
        console.error('❌ Push notification failed:', pushResult.error);
      }

      logger.info('OTP notification sent', { bookingId, customerId: booking.customerId, pushSuccess: pushResult.success });
    } catch (notificationError: any) {
      // Log error but don't fail the OTP generation
      console.error('❌ Notification error:', notificationError);
      logger.error('Failed to send OTP notification', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to customer successfully',
      // Remove this in production - only for development
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      expiresAt: otpExpiry,
      customer: {
        name: booking.customers?.name,
        phone: booking.customers?.phone ? `****${booking.customers.phone.slice(-4)}` : null,
      },
    });
  } catch (error: any) {
    logger.error('OTP generation error', error);
    return NextResponse.json(
      { error: 'Failed to generate OTP', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Verify OTP and start trip
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Support both web session and mobile JWT authentication
    const vendorAuth = await getVendorAuth(request);
    if (!vendorAuth.authenticated || !vendorAuth.vendorId) {
      return NextResponse.json({ error: vendorAuth.error || 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id: bookingId } = resolvedParams;
    const body = await request.json();
    const { otp, action } = body;

    // action can be 'start' or 'end'
    const validActions = ['start', 'end'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "start" or "end"' },
        { status: 400 }
      );
    }

    if (!otp) {
      return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
    }

    // Find the booking
    const booking = await prisma.bike_bookings.findUnique({
      where: { id: bookingId },
      include: {
        customers: {
          select: { id: true, name: true, email: true, phone: true },
        },
        vendors_bike_bookings_acceptedVendorIdTovendors: {
          select: { id: true, businessName: true, phone: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify that this vendor is authorized for this booking
    const isAuthorizedToVerify = booking.acceptedVendorId === vendorAuth.vendorId || booking.assignedVendorId === vendorAuth.vendorId;
    if (!isAuthorizedToVerify) {
      return NextResponse.json(
        { error: 'You are not authorized to verify OTP for this booking' },
        { status: 403 }
      );
    }

    if (action === 'start') {
      // Verify trip start OTP
      if (booking.status !== 'READY_FOR_PICKUP') {
        return NextResponse.json(
          { error: 'Booking is not ready for pickup' },
          { status: 400 }
        );
      }

      // Check if OTP matches
      if (booking.tripStartOtp !== otp) {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
      }

      // Check if OTP has expired
      if (booking.tripStartOtpExpiry && new Date() > booking.tripStartOtpExpiry) {
        return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
      }

      // OTP verified - start trip
      const updatedBooking = await prisma.bike_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'IN_PROGRESS',
          tripOtpVerified: true,
          tripOtpVerifiedAt: new Date(),
          pickedUpAt: new Date(), // Use pickedUpAt instead of tripStartedAt
          // Clear OTP after successful verification
          tripStartOtp: null,
          tripStartOtpExpiry: null,
        },
      });

      // Send trip started notification to customer
      try {
        const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
        await prisma.notifications.create({
          data: {
            id: notificationId,
            customerId: booking.customerId,
            title: '🚀 Trip Started!',
            body: `Your bike rental has started! Enjoy your ride and stay safe! 🏍️`,
            type: 'booking',
            serviceType: 'bike-on-rent',
            bookingId: bookingId,
            isRead: false,
          },
        });
        console.log('✅ Trip started in-app notification created:', notificationId);

        // Send push notification
        console.log('📤 Sending trip started push notification to customer:', booking.customerId);
        const pushResult = await sendNotificationToCustomer(
          booking.customerId,
          {
            title: '🚀 Trip Started!',
            body: `Your bike rental has started! Enjoy your ride and stay safe! 🏍️`,
          },
          {
            type: 'trip_started',
            serviceType: 'bike-on-rent',
            bookingId: bookingId,
            bookingNumber: updatedBooking.bookingNumber || '',
          }
        );

        if (pushResult.success) {
          console.log('✅ Trip started push notification sent successfully:', pushResult.messageId);
        } else {
          console.error('❌ Trip started push notification failed:', pushResult.error);
        }

        logger.info('Trip started notification sent', { bookingId, customerId: booking.customerId, pushSuccess: pushResult.success });
      } catch (notificationError: any) {
        // Log error but don't fail the trip start
        console.error('❌ Trip started notification error:', notificationError);
        logger.error('Failed to send trip started notification', notificationError);
      }

      // Notify vendor that bike trip has started
      if (booking.acceptedVendorId) {
        sendVendorDirectNotification({
          vendorId: booking.acceptedVendorId,
          title: '🏍️ Trip Started!',
          body: `Booking #${updatedBooking.bookingNumber} bike rental trip has been started successfully.`,
          type: 'trip_started',
          serviceType: 'bike-on-rent',
          bookingId: bookingId,
          bookingNumber: updatedBooking.bookingNumber || '',
        }).catch((err: any) => console.error('[BikeStart] Vendor notify failed:', err));
      }

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully. Trip started!',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          tripStartedAt: updatedBooking.pickedUpAt,
        },
      });
    } else if (action === 'end') {
      // Verify trip end OTP (if implemented)
      if (booking.status !== 'IN_PROGRESS') {
        return NextResponse.json(
          { error: 'Trip is not in progress' },
          { status: 400 }
        );
      }

      // Check if OTP matches
      if (booking.tripEndOtp !== otp) {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
      }

      // OTP verified - end trip
      const updatedBooking = await prisma.bike_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'COMPLETED',
          tripEndVerifiedAt: new Date(),
          actualReturnDate: new Date(),
          returnedAt: new Date(),
          // Clear OTP
          tripEndOtp: null,
        },
      });

      // Send trip completion notification to customer
      try {
        const notificationId = 'NOTIF_' + crypto.randomBytes(8).toString('hex');
        await prisma.notifications.create({
          data: {
            id: notificationId,
            customerId: booking.customerId,
            title: '🎉 Trip Completed Successfully!',
            body: `Your bike rental is complete! Hope you enjoyed the ride! 🏍️ Book again for your next adventure! ✨`,
            type: 'booking',
            serviceType: 'bike-on-rent',
            bookingId: bookingId,
            isRead: false,
          },
        });
        console.log('✅ Trip completion in-app notification created:', notificationId);

        // Send push notification
        console.log('📤 Sending trip completion push notification to customer:', booking.customerId);
        const pushResult = await sendNotificationToCustomer(
          booking.customerId,
          {
            title: '🎉 Trip Completed Successfully!',
            body: `Your bike rental is complete! Hope you enjoyed the ride! 🏍️ Book again for your next adventure! ✨`,
          },
          {
            type: 'trip_completed',
            serviceType: 'bike-on-rent',
            bookingId: bookingId,
            bookingNumber: updatedBooking.bookingNumber || '',
          }
        );

        if (pushResult.success) {
          console.log('✅ Trip completion push notification sent successfully:', pushResult.messageId);
        } else {
          console.error('❌ Trip completion push notification failed:', pushResult.error);
        }

        logger.info('Trip completion notification sent', { bookingId, customerId: booking.customerId, pushSuccess: pushResult.success });
      } catch (notificationError: any) {
        // Log error but don't fail the trip completion
        console.error('❌ Trip completion notification error:', notificationError);
        logger.error('Failed to send trip completion notification', notificationError);
      }

      // Notify vendor that bike trip has been completed
      if (booking.acceptedVendorId) {
        sendVendorDirectNotification({
          vendorId: booking.acceptedVendorId,
          title: '✅ Trip Completed!',
          body: `Booking #${updatedBooking.bookingNumber} bike rental trip has been completed successfully.`,
          type: 'trip_completed',
          serviceType: 'bike-on-rent',
          bookingId: bookingId,
          bookingNumber: updatedBooking.bookingNumber || '',
        }).catch((err: any) => console.error('[BikeComplete] Vendor notify failed:', err));
      }

      return NextResponse.json({
        success: true,
        message: 'Trip completed successfully!',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          returnedAt: updatedBooking.returnedAt,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    logger.error('OTP verification error', error);
    return NextResponse.json(
      { error: 'Failed to verify OTP', details: error?.message },
      { status: 500 }
    );
  }
}
