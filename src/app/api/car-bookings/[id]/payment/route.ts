import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// POST - Submit payment details for a booking
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idOrNumber = params.id;
    const body = await request.json();
    const { transactionId, paymentMethod, amount } = body;

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Find booking
    const booking = await prisma.chauffeur_bookings.findFirst({
      where: {
        OR: [
          { bookingNumber: idOrNumber },
          { id: idOrNumber },
        ],
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Update booking with payment details
    // Using existing schema fields: transactionId, paidAmount, paymentStatus
    // PARTIAL status indicates payment submitted, pending verification
    const updatedBooking = await prisma.chauffeur_bookings.update({
      where: { id: booking.id },
      data: {
        transactionId: transactionId,
        partialPayment: amount || 0,
        paymentMethod: paymentMethod || 'UPI',
        paymentStatus: 'PARTIAL', // Indicates pending verification
        adminNotes: `Payment submitted: ${transactionId} via ${paymentMethod || 'UPI'}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment details submitted. Awaiting verification.',
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
