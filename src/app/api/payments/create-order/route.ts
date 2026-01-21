import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import razorpayInstance, { RAZORPAY_CONFIG } from '@/lib/razorpay/config';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// POST - Create a Razorpay order for a booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
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

    // Check if booking is in ACCEPTED status (vendor has accepted, waiting for payment)
    if (booking.status !== 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Booking must be accepted by a vendor before payment' },
        { status: 400 }
      );
    }

    // Check if payment already exists
    if (booking.razorpayOrderId && booking.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Payment already completed for this booking' },
        { status: 400 }
      );
    }

    // If there's an existing order that wasn't completed, we can create a new one
    // Convert amount to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(booking.grandTotal * 100);

    // Create Razorpay order
    const order = await razorpayInstance.orders.create({
      amount: amountInPaise,
      currency: RAZORPAY_CONFIG.currency,
      receipt: booking.bookingNumber,
      notes: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        vehicleName: booking.acceptedVehicleName || booking.requestedVehicleName,
        vendorId: booking.acceptedVendorId || '',
        vendorName: booking.vendors_bike_bookings_acceptedVendorIdTovendors?.businessName || '',
      },
    });

    // Update booking with Razorpay order ID
    await prisma.bike_bookings.update({
      where: { id: bookingId },
      data: {
        razorpayOrderId: order.id,
        paymentAttempts: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        vehicleName: booking.acceptedVehicleName || booking.requestedVehicleName,
        vendorName: booking.vendors_bike_bookings_acceptedVendorIdTovendors?.businessName,
        grandTotal: booking.grandTotal,
      },
      razorpayConfig: {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id',
        name: RAZORPAY_CONFIG.name,
        description: `${booking.requestedVehicleName} - ${booking.totalDays} day(s) rental`,
        image: RAZORPAY_CONFIG.image,
        theme: RAZORPAY_CONFIG.theme,
        prefill: {
          name: booking.customerName,
          email: booking.customerEmail,
          contact: booking.customerPhone,
        },
      },
    });
  } catch (error: any) {
    logger.error('Failed to create Razorpay order', error);

    // Update booking with error
    if (error?.bookingId) {
      await prisma.bike_bookings.update({
        where: { id: error.bookingId },
        data: {
          lastPaymentError: error.message || 'Failed to create payment order',
        },
      }).catch(() => {});
    }

    return NextResponse.json(
      { error: 'Failed to create payment order', details: error?.message },
      { status: 500 }
    );
  }
}
