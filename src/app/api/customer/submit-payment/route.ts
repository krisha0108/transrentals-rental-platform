// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, bookingType, paymentMethod, transactionId, payerName, amount } = body;

    logger.info('Payment submission request', {
      bookingId,
      bookingType,
      hasTransactionId: !!transactionId,
      paymentMethod,
      amount,
    });

    if (!bookingId || !transactionId) {
      logger.error('Missing required fields', { bookingId, transactionId });
      return NextResponse.json(
        { success: false, message: 'Booking ID and Transaction ID are required' },
        { status: 400 }
      );
    }

    if (!bookingType) {
      logger.error('Missing booking type', { bookingId });
      return NextResponse.json(
        { success: false, message: 'Booking type is required' },
        { status: 400 }
      );
    }

    const paymentDate = new Date();
    let booking;

    try {
      switch (bookingType) {
        case 'bike':
          booking = await prisma.bike_bookings.update({
            where: { id: bookingId },
            data: {
              advancePaymentRef: transactionId,
              advancePaymentDate: paymentDate,
              paymentMethod: paymentMethod || 'upi',
              paymentStatus: 'SUBMITTED',
              status: 'PAYMENT_SUBMITTED',
            },
          });
          break;

        case 'car':
        case 'self-drive':
          booking = await prisma.car_bookings.update({
            where: { id: bookingId },
            data: {
              advancePaymentRef: transactionId,
              advancePaymentDate: paymentDate,
              paymentMethod: paymentMethod || 'upi',
              paymentStatus: 'SUBMITTED',
              status: 'PAYMENT_SUBMITTED',
            },
          });
          break;

        case 'chauffeur':
          booking = await prisma.chauffeur_bookings.update({
            where: { id: bookingId },
            data: {
              transactionId: transactionId,
              paidAmount: amount || 0,
              paymentMethod: paymentMethod || 'upi',
              paymentStatus: 'SUBMITTED',
              status: 'PAYMENT_SUBMITTED',
            },
          });
          break;

        case 'bus':
          booking = await prisma.bus_bookings.update({
            where: { id: bookingId },
            data: {
              advancePaymentRef: transactionId,
              advancePaymentDate: paymentDate,
              paymentMethod: paymentMethod || 'upi',
              paymentStatus: 'SUBMITTED',
              status: 'PAYMENT_SUBMITTED',
            },
          });
          break;

        case 'truck':
          booking = await prisma.truck_bookings.update({
            where: { id: bookingId },
            data: {
              advancePaymentRef: transactionId,
              advancePaymentDate: paymentDate,
              paymentMethod: paymentMethod || 'upi',
              paymentStatus: 'SUBMITTED',
              status: 'PAYMENT_SUBMITTED',
            },
          });
          break;

        case 'equipment':
          booking = await prisma.equipment_bookings.update({
            where: { id: bookingId },
            data: {
              advancePaymentRef: transactionId,
              advancePaymentDate: paymentDate,
              paymentMethod: paymentMethod || 'upi',
              paymentStatus: 'SUBMITTED',
              status: 'PAYMENT_SUBMITTED',
            },
          });
          break;

        case 'packers':
        case 'packers-movers':
          booking = await prisma.packers_bookings.update({
            where: { id: bookingId },
            data: {
              advancePaymentRef: transactionId,
              advancePaymentDate: paymentDate,
              paymentMethod: paymentMethod || 'upi',
              paymentStatus: 'SUBMITTED',
              status: 'PAYMENT_SUBMITTED',
            },
          });
          break;

        case 'luxury':
          booking = await prisma.luxury_bookings.update({
            where: { id: bookingId },
            data: {
              paymentTransactionId: transactionId,
              paymentSubmittedAt: paymentDate,
              paymentMethod: paymentMethod || 'upi',
              paymentStatus: 'SUBMITTED',
              status: 'PAYMENT_SUBMITTED',
            },
          });
          break;

        default:
          logger.error('Invalid booking type', { bookingType });
          return NextResponse.json(
            { success: false, message: `Invalid booking type: ${bookingType}` },
            { status: 400 }
          );
      }
    } catch (dbError: any) {
      logger.error('Database error updating booking payment', {
        bookingId,
        bookingType,
        error: dbError?.message,
        code: dbError?.code,
        meta: dbError?.meta,
      });

      if (dbError?.code === 'P2025') {
        return NextResponse.json(
          { success: false, message: 'Booking not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Failed to update booking payment status',
          details: dbError?.message
        },
        { status: 500 }
      );
    }

    logger.info('Payment submitted', {
      bookingId,
      bookingType,
      transactionId,
      paymentMethod,
      payerName,
      amount,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment details submitted successfully. Our team will verify and confirm shortly.',
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
      },
    });
  } catch (error) {
    logger.error('Error submitting payment', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to submit payment' },
      { status: 500 }
    );
  }
}
