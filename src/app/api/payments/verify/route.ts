import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyRazorpaySignature } from '@/lib/razorpay/config';
import logger from '@/lib/security/logger';
import {
  sendQuoteRequestNotificationToVendors,
  sendVendorDirectNotification,
} from '@/lib/utils/vendor-notification-sender';
import { sendPushNotification } from '@/lib/services/push-notification-service';

export const dynamic = 'force-dynamic';

type BookingType = 'bike' | 'car' | 'self-drive' | 'truck' | 'bus' | 'packers' | 'equipment' | 'luxury' | 'chauffeur' | 'wander_quote';

// POST - Verify Razorpay payment and update booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      bookingType = 'bike',
    } = body as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      bookingId: string;
      bookingType: BookingType;
    };

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields' },
        { status: 400 }
      );
    }

    // Verify HMAC signature first
    const isValidSignature = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Payment verification failed - invalid signature' },
        { status: 400 }
      );
    }

    const paidAt = new Date();

    // ─── BIKE ─────────────────────────────────────────────────────────────────
    if (bookingType === 'bike') {
      const booking = await prisma.bike_bookings.findUnique({
        where: { id: bookingId },
      });

      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      if (booking.razorpayOrderId && booking.razorpayOrderId !== razorpay_order_id) {
        return NextResponse.json({ error: 'Order ID mismatch' }, { status: 400 });
      }

      await prisma.bike_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'PAYMENT_VERIFIED',
          paymentStatus: 'PAID',
          paidAmount: booking.advanceAmount ?? 0,
          transactionId: razorpay_payment_id,
          paymentMethod: 'ONLINE',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          lastPaymentError: null,
        },
      });

      const vendorId = booking.assignedVendorId || booking.acceptedVendorId;
      if (vendorId) {
        await sendVendorDirectNotification({
          vendorId,
          title: 'Advance Payment Received',
          body: `Customer ${booking.customerName} has paid the advance for booking #${booking.bookingNumber}. Please confirm the booking.`,
          type: 'advance_paid',
          serviceType: 'bike',
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
        }).catch(err => logger.error('Bike vendor notification failed', err));
      }

      return NextResponse.json({
        success: true,
        message: 'Advance payment verified! Your booking is confirmed.',
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: 'PAYMENT_VERIFIED',
          paymentStatus: 'PAID',
          transactionId: razorpay_payment_id,
          paidAmount: booking.advanceAmount ?? 0,
        },
      });
    }

    // ─── CAR (SD- prefix = self-drive, same as 'self-drive' type) ──────────────
    if (bookingType === 'car') {
      const booking = await prisma.car_bookings.findUnique({
        where: { id: bookingId },
      });

      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      await prisma.car_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'PAYMENT_VERIFIED',
          paymentStatus: 'PAID',
          paidAmount: booking.advanceAmount ?? 0,
          transactionId: razorpay_payment_id,
          paymentMethod: 'ONLINE',
        },
      });

      const vendorId = booking.assignedVendorId || booking.acceptedVendorId;
      if (vendorId) {
        await sendVendorDirectNotification({
          vendorId,
          title: 'Advance Payment Received',
          body: `Customer ${booking.customerName} has paid the advance for booking #${booking.bookingNumber}. Please confirm the booking.`,
          type: 'advance_paid',
          serviceType: 'car',
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
        }).catch(err => logger.error('Car vendor notification failed', err));
      }

      return NextResponse.json({
        success: true,
        message: 'Advance payment verified! Your booking is confirmed.',
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: 'PAYMENT_VERIFIED',
          paymentStatus: 'PAID',
          transactionId: razorpay_payment_id,
          paidAmount: booking.advanceAmount ?? 0,
        },
      });
    }

    // ─── SELF-DRIVE ───────────────────────────────────────────────────────────
    if (bookingType === 'self-drive') {
      const booking = await prisma.car_bookings.findUnique({
        where: { id: bookingId },
      });

      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      await prisma.car_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'PAYMENT_VERIFIED',
          paymentStatus: 'PAID',
          paidAmount: booking.advanceAmount ?? 0,
          transactionId: razorpay_payment_id,
          paymentMethod: 'ONLINE',
        },
      });

      const vendorId = booking.assignedVendorId || booking.acceptedVendorId;
      if (vendorId) {
        await sendVendorDirectNotification({
          vendorId,
          title: 'Advance Payment Received',
          body: `Customer ${booking.customerName} has paid the advance for booking #${booking.bookingNumber}. Please confirm the booking.`,
          type: 'advance_paid',
          serviceType: 'self-drive',
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
        }).catch(err => logger.error('Self-drive vendor notification failed', err));
      }

      return NextResponse.json({
        success: true,
        message: 'Advance payment verified! Your booking is confirmed.',
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: 'PAYMENT_VERIFIED',
          paymentStatus: 'PAID',
          transactionId: razorpay_payment_id,
          paidAmount: booking.advanceAmount ?? 0,
        },
      });
    }

    // ─── TRUCK ────────────────────────────────────────────────────────────────
    if (bookingType === 'truck') {
      const booking = await prisma.truck_bookings.findUnique({
        where: { id: bookingId },
      });

      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      await prisma.truck_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'ADVANCE_PAID',
          paymentStatus: 'PAID',
          advancePaid: booking.advanceAmount ?? 0,
          advancePaidAt: paidAt,
          paymentMethod: 'ONLINE',
          advancePaymentRef: razorpay_payment_id,
        },
      });

      if (booking.vendorId) await sendVendorDirectNotification({
        vendorId: booking.vendorId,
        title: 'Advance Payment Received',
        body: `Customer ${booking.customerName} has paid the advance for booking #${booking.bookingNumber}. Please confirm the booking.`,
        type: 'advance_paid',
        serviceType: 'truck',
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
      }).catch(err => logger.error('Truck vendor notification failed', err));

      return NextResponse.json({
        success: true,
        message: 'Advance payment verified! Your booking is confirmed.',
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: 'ADVANCE_PAID',
          paymentStatus: 'PAID',
          transactionId: razorpay_payment_id,
          paidAmount: booking.advanceAmount ?? 0,
        },
      });
    }

    // ─── BUS ──────────────────────────────────────────────────────────────────
    if (bookingType === 'bus') {
      const booking = await prisma.bus_bookings.findUnique({
        where: { id: bookingId },
      });

      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      await prisma.bus_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'ADVANCE_PAID',
          paymentStatus: 'PAID',
          advancePaid: booking.advanceAmount ?? 0,
          advancePaidAt: paidAt,
          paymentMethod: 'ONLINE',
          transactionIds: razorpay_payment_id,
        },
      });

      if (booking.vendorId) await sendVendorDirectNotification({
        vendorId: booking.vendorId,
        title: 'Advance Payment Received',
        body: `Customer ${booking.customerName} has paid the advance for booking #${booking.bookingNumber}. Please confirm the booking.`,
        type: 'advance_paid',
        serviceType: 'bus',
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
      }).catch(err => logger.error('Bus vendor notification failed', err));

      return NextResponse.json({
        success: true,
        message: 'Advance payment verified! Your booking is confirmed.',
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: 'ADVANCE_PAID',
          paymentStatus: 'PAID',
          transactionId: razorpay_payment_id,
          paidAmount: booking.advanceAmount ?? 0,
        },
      });
    }

    // ─── PACKERS ──────────────────────────────────────────────────────────────
    if (bookingType === 'packers') {
      const booking = await prisma.packers_bookings.findUnique({
        where: { id: bookingId },
      });

      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      await prisma.packers_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'ADVANCE_PAID',
          paymentStatus: 'PAID',
          advancePaid: booking.advanceAmount ?? 0,
          advancePaidAt: paidAt,
        },
      });

      if (booking.vendorId) await sendVendorDirectNotification({
        vendorId: booking.vendorId,
        title: 'Advance Payment Received',
        body: `Customer ${booking.customerName} has paid the advance for booking #${booking.bookingNumber}. Please confirm the booking.`,
        type: 'advance_paid',
        serviceType: 'packers',
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
      }).catch(err => logger.error('Packers vendor notification failed', err));

      return NextResponse.json({
        success: true,
        message: 'Advance payment verified! Your booking is confirmed.',
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: 'ADVANCE_PAID',
          paymentStatus: 'PAID',
          transactionId: razorpay_payment_id,
          paidAmount: booking.advanceAmount ?? 0,
        },
      });
    }

    // ─── EQUIPMENT ────────────────────────────────────────────────────────────
    if (bookingType === 'equipment') {
      const booking = await prisma.equipment_bookings.findUnique({
        where: { id: bookingId },
      });

      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      await prisma.equipment_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'ADVANCE_PAID',
          paymentStatus: 'PAID',
          advancePaid: booking.advanceAmount ?? 0,
          advancePaidAt: paidAt,
        },
      });

      if (booking.vendorId) await sendVendorDirectNotification({
        vendorId: booking.vendorId,
        title: 'Advance Payment Received',
        body: `Customer ${booking.customerName} has paid the advance for booking #${booking.bookingNumber}. Please confirm the booking.`,
        type: 'advance_paid',
        serviceType: 'equipment',
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
      }).catch(err => logger.error('Equipment vendor notification failed', err));

      return NextResponse.json({
        success: true,
        message: 'Advance payment verified! Your booking is confirmed.',
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: 'ADVANCE_PAID',
          paymentStatus: 'PAID',
          transactionId: razorpay_payment_id,
          paidAmount: booking.advanceAmount ?? 0,
        },
      });
    }

    // ─── LUXURY ───────────────────────────────────────────────────────────────
    if (bookingType === 'luxury') {
      const booking = await prisma.luxury_bookings.findUnique({
        where: { id: bookingId },
      });

      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      const vendorId = booking.assignedVendorId || booking.acceptedVendorId;

      await prisma.luxury_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'ADVANCE_PAID',
          paymentStatus: 'PAID',
          advancePaid: booking.advanceAmount ?? 0,
          advancePaidAt: paidAt,
          paymentMethod: 'ONLINE',
          paymentTransactionId: razorpay_payment_id,
        },
      });

      if (vendorId) {
        await sendVendorDirectNotification({
          vendorId,
          title: 'Advance Payment Received',
          body: `Customer ${booking.customerName} has paid the advance for booking #${booking.bookingNumber}. Please confirm the booking.`,
          type: 'advance_paid',
          serviceType: 'luxury',
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
        }).catch(err => logger.error('Luxury vendor notification failed', err));
      }

      return NextResponse.json({
        success: true,
        message: 'Advance payment verified! Your booking is confirmed.',
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: 'ADVANCE_PAID',
          paymentStatus: 'PAID',
          transactionId: razorpay_payment_id,
          paidAmount: booking.advanceAmount ?? 0,
        },
      });
    }

    // ─── CHAUFFEUR ────────────────────────────────────────────────────────────
    if (bookingType === 'chauffeur') {
      const booking = await prisma.chauffeur_bookings.findUnique({
        where: { id: bookingId },
      });

      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      const advanceAmount = booking.partialPayment || Math.round(booking.grandTotal * 0.20);
      const responseDeadline = new Date(paidAt.getTime() + 4 * 60 * 60 * 1000);

      await prisma.chauffeur_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'BROADCASTED',
          paymentStatus: 'PARTIAL',
          paidAmount: advanceAmount,
          partialPayment: advanceAmount,
          remainingPayment: booking.grandTotal - advanceAmount,
          broadcastedAt: paidAt,
          responseDeadline,
          transactionId: razorpay_payment_id,
          paymentMethod: 'ONLINE',
        },
      });

      if (booking.locationId) {
        await sendQuoteRequestNotificationToVendors({
          requestId: booking.id,
          requestNumber: booking.bookingNumber,
          locationId: booking.locationId,
          locationName: booking.locationName,
          customerName: booking.customerName,
          serviceType: 'chauffeur',
          serviceDisplayName: 'Chauffeur Service',
        }).catch(err => logger.error('Chauffeur broadcast notification failed', err));
      }

      // Notify all active drivers about new available booking
      try {
        const tripLabel = booking.tripType
          ? booking.tripType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
          : 'Car Rental';
        const notifTitle = '🚗 New Booking Available!';
        const notifBody = `${tripLabel} trip from ${booking.pickupCity || booking.locationName || 'your city'} on ${new Date(booking.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}. Tap to view.`;

        const [indepDrivers, staffDrivers] = await Promise.all([
          prisma.drivers.findMany({
            where: { status: 'ACTIVE', fcmToken: { not: null } },
            select: { fcmToken: true },
          }),
          prisma.vendor_staff.findMany({
            where: { status: 'ACTIVE', role: 'DRIVER', fcmToken: { not: null } },
            select: { fcmToken: true },
          }),
        ]);

        const allTokens = [
          ...indepDrivers.map((d: { fcmToken: string | null }) => d.fcmToken!),
          ...staffDrivers.map((d: { fcmToken: string | null }) => d.fcmToken!),
        ].filter(Boolean);

        for (const token of allTokens) {
          sendPushNotification(
            token,
            { title: notifTitle, body: notifBody },
            { type: 'new_available_booking', bookingId: booking.id, source: 'chauffeur' },
            { channelId: 'booking_confirmed_channel', sound: 'booking_confirmed' }
          ).catch(() => {});
        }
      } catch (driverNotifErr) {
        logger.error('Chauffeur driver broadcast notification failed', driverNotifErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified! Your booking is being broadcasted to vendors.',
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: 'BROADCASTED',
          paymentStatus: 'PARTIAL',
          transactionId: razorpay_payment_id,
          paidAmount: advanceAmount,
        },
      });
    }

    // ─── WANDER QUOTE ─────────────────────────────────────────────────────────
    if (bookingType === 'wander_quote') {
      const booking = await (prisma as any).wander_bookings.findUnique({
        where: { id: bookingId },
      });
      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

      await (prisma as any).wander_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'CONFIRMED',
          advancePaid: true,
          advancePaidAt: paidAt,
          paymentMethod: 'ONLINE',
          transactionId: razorpay_payment_id,
        },
      });

      await sendVendorDirectNotification({
        vendorId: booking.vendorId,
        title: 'Advance Payment Received',
        body: `Customer has paid the advance for tour booking ${booking.bookingId}. Please confirm the tour.`,
        type: 'advance_paid',
        serviceType: 'wander',
        bookingId: booking.id,
        bookingNumber: booking.bookingId,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Advance payment verified! Your tour booking is confirmed.',
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingId,
          status: 'CONFIRMED',
          transactionId: razorpay_payment_id,
          paidAmount: booking.advanceAmount ?? 0,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid booking type' }, { status: 400 });
  } catch (error: any) {
    logger.error('Failed to verify payment', error);
    return NextResponse.json(
      { error: 'Failed to verify payment', details: error?.message },
      { status: 500 }
    );
  }
}
