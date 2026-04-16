// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import razorpayInstance from '@/lib/razorpay/config';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/refund
 * Admin-only: Process a Razorpay refund for a cancelled booking.
 *
 * Body: { bookingId, bookingType, amount?, notes? }
 * bookingType: 'self_drive' | 'bike' | 'bus' | 'truck' | 'equipment' | 'luxury' | 'chauffeur'
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin-only check
    const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
    if (!adminRoles.includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { bookingId, bookingType = 'self_drive', amount, notes } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    // Fetch the booking
    const booking = await prisma.car_bookings.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'CANCELLED') {
      return NextResponse.json(
        { error: 'Only cancelled bookings can be refunded' },
        { status: 400 }
      );
    }

    if (!booking.transactionId) {
      return NextResponse.json(
        { error: 'No Razorpay payment ID found. Manual refund may be needed.' },
        { status: 400 }
      );
    }

    // Amount to refund: use provided amount or booking's refundAmount or paidAmount
    const refundAmountPaise = Math.round(
      (amount ?? booking.refundAmount ?? booking.paidAmount ?? 0) * 100
    );

    if (refundAmountPaise <= 0) {
      return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 });
    }

    // Create Razorpay refund
    const refund = await razorpayInstance.payments.refund(booking.transactionId, {
      amount: refundAmountPaise,
      notes: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        reason: notes || 'Customer cancellation refund',
      },
    });

    // Update booking with refund info
    await prisma.car_bookings.update({
      where: { id: bookingId },
      data: {
        refundAmount: refundAmountPaise / 100,
        refundTransactionId: refund.id,
        paymentStatus: 'REFUNDED',
        status: 'REFUNDED',
      },
    });

    // Notify customer
    if (booking.customerId) {
      await prisma.notifications.create({
        data: {
          userId: booking.customerId,
          userType: 'CUSTOMER',
          title: 'Refund Processed',
          message: `Your refund of ₹${(refundAmountPaise / 100).toLocaleString('en-IN')} for booking #${booking.bookingNumber} has been initiated. It will reflect in 5-7 business days.`,
          type: 'REFUND_PROCESSED',
          bookingId: booking.id,
          bookingType: 'self_drive',
        },
      }).catch(() => {});
    }

    logger.info('Razorpay refund processed', {
      bookingId,
      refundId: refund.id,
      amount: refundAmountPaise / 100,
    });

    return NextResponse.json({
      success: true,
      message: `Refund of ₹${(refundAmountPaise / 100).toLocaleString('en-IN')} initiated successfully`,
      refund: {
        id: refund.id,
        amount: refundAmountPaise / 100,
        status: refund.status,
      },
    });
  } catch (error: any) {
    logger.error('Refund processing failed', error);
    return NextResponse.json(
      { error: 'Refund failed', details: error?.description || error?.message },
      { status: 500 }
    );
  }
}
