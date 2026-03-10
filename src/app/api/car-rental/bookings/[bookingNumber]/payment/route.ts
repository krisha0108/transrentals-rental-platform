import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// POST - Submit payment details
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingNumber: string }> | { bookingNumber: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params;
    const { bookingNumber } = resolvedParams;

    const body = await request.json();
    const { transactionId, paymentMethod, amount } = body;

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Find the booking
    const booking = await prisma.chauffeur_bookings.findUnique({
      where: { bookingNumber },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Calculate advance amount if not provided (30% of grand total)
    const advanceAmount = amount || Math.round(booking.grandTotal * 0.3);

    // Update booking with payment details
    // Keep status as PENDING_PAYMENT - admin will approve and change to PENDING_VENDOR
    const updatedBooking = await prisma.chauffeur_bookings.update({
      where: { bookingNumber },
      data: {
        status: 'PAYMENT_SUBMITTED',
        transactionId,
        paymentMethod: paymentMethod || 'UPI',
        paidAmount: advanceAmount,
        partialPayment: advanceAmount,
        paymentStatus: 'SUBMITTED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment submitted successfully. Admin will verify and assign a vendor shortly.',
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        status: updatedBooking.status,
        paymentStatus: updatedBooking.paymentStatus,
      },
    });
  } catch (error: any) {
    logger.error('Failed to submit payment', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit payment', details: error?.message },
      { status: 500 }
    );
  }
}
