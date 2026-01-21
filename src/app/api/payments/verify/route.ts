import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyRazorpaySignature } from '@/lib/razorpay/config';
import { emitPaymentReceived, PaymentReceivedData } from '@/lib/socket';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// POST - Verify Razorpay payment and update booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields' },
        { status: 400 }
      );
    }

    // Get the booking
    const booking = await prisma.bike_bookings.findUnique({
      where: { id: bookingId },
      include: {
        vendors_bike_bookings_acceptedVendorIdTovendors: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify the order ID matches
    if (booking.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json(
        { error: 'Order ID mismatch' },
        { status: 400 }
      );
    }

    // Verify the signature
    const isValidSignature = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValidSignature) {
      // Update booking with failed payment
      await prisma.bike_bookings.update({
        where: { id: bookingId },
        data: {
          lastPaymentError: 'Payment signature verification failed',
        },
      });

      return NextResponse.json(
        { error: 'Payment verification failed - invalid signature' },
        { status: 400 }
      );
    }

    // Payment verified successfully - update booking
    const paidAt = new Date();
    const updatedBooking = await prisma.bike_bookings.update({
      where: { id: bookingId },
      data: {
        status: 'PAYMENT_VERIFIED',
        paymentStatus: 'PAID',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAmount: booking.grandTotal,
        paymentMethod: 'ONLINE',
        transactionId: razorpay_payment_id,
        lastPaymentError: null, // Clear any previous errors
      },
      include: {
        locations: { select: { name: true, slug: true } },
        vendors_bike_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true } },
      },
    });

    // Emit payment received notification to vendor
    if (booking.acceptedVendorId) {
      const paymentData: PaymentReceivedData = {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        amount: booking.grandTotal,
        paymentId: razorpay_payment_id,
        paidAt: paidAt.toISOString(),
      };

      emitPaymentReceived(booking.acceptedVendorId, bookingId, paymentData);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully! Your booking is confirmed.',
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        paymentStatus: updatedBooking.paymentStatus,
        vehicleName: updatedBooking.acceptedVehicleName,
        location: updatedBooking.locations,
        pickupDate: updatedBooking.pickupDate,
        pickupTime: updatedBooking.pickupTime,
        dropDate: updatedBooking.dropDate,
        dropTime: updatedBooking.dropTime,
        totalDays: updatedBooking.totalDays,
        grandTotal: updatedBooking.grandTotal,
        paidAmount: updatedBooking.paidAmount,
        vendor: updatedBooking.vendors_bike_bookings_acceptedVendorIdTovendors
          ? {
              id: updatedBooking.vendors_bike_bookings_acceptedVendorIdTovendors.id,
              name: updatedBooking.vendors_bike_bookings_acceptedVendorIdTovendors.businessName,
              phone: updatedBooking.vendors_bike_bookings_acceptedVendorIdTovendors.phone,
            }
          : null,
        transactionId: updatedBooking.transactionId,
      },
    });
  } catch (error: any) {
    logger.error('Failed to verify payment', error);
    return NextResponse.json(
      { error: 'Failed to verify payment', details: error?.message },
      { status: 500 }
    );
  }
}
