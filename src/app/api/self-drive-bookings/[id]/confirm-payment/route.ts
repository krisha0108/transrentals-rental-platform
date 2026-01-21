// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// POST - Customer submits payment for car booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      amount, // Advance amount paid
      paymentReference, // UPI/Transaction reference
      paymentProof, // Screenshot URL
      paymentMethod, // UPI, BANK_TRANSFER, etc.
    } = body;

    // Find the booking
    const booking = await prisma.car_bookings.findUnique({
      where: { id },
    });

    if (!booking) {
      // Try finding by booking number
      const bookingByNumber = await prisma.car_bookings.findUnique({
        where: { bookingNumber: id },
      });

      if (!bookingByNumber) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      return handlePaymentSubmission(bookingByNumber, amount, paymentReference, paymentProof, paymentMethod);
    }

    return handlePaymentSubmission(booking, amount, paymentReference, paymentProof, paymentMethod);
  } catch (error: any) {
    logger.error('Payment confirmation error', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment', details: error?.message },
      { status: 500 }
    );
  }
}

async function handlePaymentSubmission(
  booking: any,
  amount: number | undefined,
  paymentReference: string | undefined,
  paymentProof: string | undefined,
  paymentMethod: string | undefined
) {
  // Check if booking is in correct status
  if (booking.status !== 'PENDING_PAYMENT') {
    return NextResponse.json(
      { error: 'Payment already submitted or booking not in pending state' },
      { status: 400 }
    );
  }

  // Validate payment reference
  if (!paymentReference) {
    return NextResponse.json(
      { error: 'Payment reference is required' },
      { status: 400 }
    );
  }

  // Update booking with payment details
  const updatedBooking = await prisma.car_bookings.update({
    where: { id: booking.id },
    data: {
      status: 'PAYMENT_SUBMITTED',
      advanceAmount: amount || booking.grandTotal,
      advancePaymentRef: paymentReference,
      advancePaymentProof: paymentProof || null,
      advancePaymentDate: new Date(),
      paymentMethod: paymentMethod || 'UPI',
      paymentStatus: 'PENDING', // Still pending until admin verifies
    },
    include: {
      locations: { select: { name: true, slug: true } },
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Payment submitted successfully. Awaiting admin verification.',
    booking: {
      id: updatedBooking.id,
      bookingNumber: updatedBooking.bookingNumber,
      status: updatedBooking.status,
      paymentStatus: updatedBooking.paymentStatus,
      advanceAmount: updatedBooking.advanceAmount,
      advancePaymentRef: updatedBooking.advancePaymentRef,
    },
  });
}
