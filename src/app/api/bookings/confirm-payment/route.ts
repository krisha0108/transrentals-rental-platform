import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// POST - Customer confirms payment submission (handles bike, car, bus, and equipment bookings)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, paymentReference, paymentProof, paymentMethod, amount } = body;

    if (!bookingId || !paymentReference) {
      return NextResponse.json(
        { error: 'Booking ID and payment reference are required' },
        { status: 400 }
      );
    }

    // Try to find bike booking first
    let bikeBooking = await prisma.bike_bookings.findUnique({
      where: { id: bookingId },
    });

    if (bikeBooking) {
      const allowedStatuses = ['PENDING_PAYMENT', 'PENDING', 'BROADCASTED'];
      if (!allowedStatuses.includes(bikeBooking.status)) {
        return NextResponse.json(
          { error: `Cannot confirm payment for booking with status: ${bikeBooking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await prisma.bike_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'PAYMENT_SUBMITTED',
          advanceAmount: amount || bikeBooking.totalAmount,
          advancePaymentRef: paymentReference,
          advancePaymentProof: paymentProof || null,
          advancePaymentDate: new Date(),
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          paymentStatus: 'PENDING',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Payment confirmation submitted successfully',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          advancePaymentRef: updatedBooking.advancePaymentRef,
          type: 'bike',
        },
      });
    }

    // Try car booking
    let carBooking = await prisma.car_bookings.findUnique({
      where: { id: bookingId },
    });

    if (carBooking) {
      const allowedStatuses = ['PENDING_PAYMENT', 'PENDING', 'BROADCASTED'];
      if (!allowedStatuses.includes(carBooking.status)) {
        return NextResponse.json(
          { error: `Cannot confirm payment for booking with status: ${carBooking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await prisma.car_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'PAYMENT_SUBMITTED',
          advanceAmount: amount || carBooking.grandTotal,
          advancePaymentRef: paymentReference,
          advancePaymentProof: paymentProof || null,
          advancePaymentDate: new Date(),
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          paymentStatus: 'PENDING',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Payment confirmation submitted successfully',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          advancePaymentRef: updatedBooking.advancePaymentRef,
          type: 'car',
        },
      });
    }

    // Try bus booking
    let busBooking = await prisma.bus_bookings.findUnique({
      where: { id: bookingId },
    });

    if (busBooking) {
      if (busBooking.status !== 'PENDING_PAYMENT') {
        return NextResponse.json(
          { error: `Cannot confirm payment for booking with status: ${busBooking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await prisma.bus_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'PAYMENT_SUBMITTED',
          advancePaymentRef: paymentReference,
          advancePaymentProof: paymentProof || null,
          advancePaymentDate: new Date(),
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          paymentStatus: 'PENDING',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Payment confirmation submitted successfully',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          advancePaymentRef: updatedBooking.advancePaymentRef,
          type: 'bus',
        },
      });
    }

    // Try truck booking
    let truckBooking = await prisma.truck_bookings.findUnique({
      where: { id: bookingId },
    });

    if (truckBooking) {
      // Handle truck booking
      if (truckBooking.status !== 'PENDING_PAYMENT') {
        return NextResponse.json(
          { error: `Cannot confirm payment for booking with status: ${truckBooking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await prisma.truck_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'PAYMENT_SUBMITTED',
          advancePaymentRef: paymentReference,
          advancePaymentProof: paymentProof || null,
          advancePaymentDate: new Date(),
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          paymentStatus: 'PENDING',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Payment confirmation submitted successfully',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          advancePaymentRef: updatedBooking.advancePaymentRef,
          type: 'truck',
        },
      });
    }

    // Try packers booking
    let packersBooking = await prisma.packers_bookings.findUnique({
      where: { id: bookingId },
    });

    if (packersBooking) {
      // Handle packers booking
      if (packersBooking.status !== 'PENDING_PAYMENT') {
        return NextResponse.json(
          { error: `Cannot confirm payment for booking with status: ${packersBooking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await prisma.packers_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'PAYMENT_SUBMITTED',
          paymentStatus: 'PENDING',
          advancePaid: amount || packersBooking.advanceAmount,
          advancePaidAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Payment confirmation submitted successfully',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          type: 'packers',
        },
      });
    }

    // Try equipment booking
    let equipmentBooking = await prisma.equipment_bookings.findUnique({
      where: { id: bookingId },
    });

    if (equipmentBooking) {
      // Handle equipment booking
      if (equipmentBooking.status !== 'PENDING_PAYMENT') {
        return NextResponse.json(
          { error: `Cannot confirm payment for booking with status: ${equipmentBooking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await prisma.equipment_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'PAYMENT_SUBMITTED',
          paymentStatus: 'PENDING',
          advancePaid: amount || equipmentBooking.advanceAmount,
          advancePaidAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Payment confirmation submitted successfully',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          type: 'equipment',
        },
      });
    }

    // Try chauffeur (car rental) booking
    let chauffeurBooking = await prisma.chauffeur_bookings.findUnique({
      where: { id: bookingId },
    });

    if (chauffeurBooking) {
      if (chauffeurBooking.status !== 'PENDING_PAYMENT') {
        return NextResponse.json(
          { error: `Cannot confirm payment for booking with status: ${chauffeurBooking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await prisma.chauffeur_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'PAYMENT_SUBMITTED',
          paymentStatus: 'SUBMITTED',
          paidAmount: amount || chauffeurBooking.partialPayment || chauffeurBooking.grandTotal,
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          transactionId: paymentReference,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Payment confirmation submitted successfully',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          transactionId: updatedBooking.transactionId,
          type: 'chauffeur',
        },
      });
    }

    // Try luxury booking
    let luxuryBooking = await prisma.luxury_bookings.findUnique({
      where: { id: bookingId },
    });

    if (luxuryBooking) {
      if (luxuryBooking.status !== 'PENDING_PAYMENT') {
        return NextResponse.json(
          { error: `Cannot confirm payment for booking with status: ${luxuryBooking.status}` },
          { status: 400 }
        );
      }

      const updatedBooking = await prisma.luxury_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'PAYMENT_SUBMITTED',
          paymentStatus: 'SUBMITTED',
          advancePaid: amount || luxuryBooking.advanceAmount,
          advancePaidAt: new Date(),
          advancePaymentRef: paymentReference,
          advancePaymentProof: paymentProof || null,
          advancePaymentDate: new Date(),
          advancePaymentMethod: paymentMethod || 'BANK_TRANSFER',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Payment confirmation submitted successfully',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          advancePaymentRef: updatedBooking.advancePaymentRef,
          type: 'luxury',
        },
      });
    }

    // Try wander booking
    let wanderBooking = await (prisma as any).wander_bookings.findUnique({
      where: { id: bookingId },
    });

    if (wanderBooking) {
      const updatedBooking = await (prisma as any).wander_bookings.update({
        where: { id: bookingId },
        data: {
          status: 'PAYMENT_SUBMITTED',
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          advancePaymentRef: paymentReference,
          advancePaymentProof: paymentProof || null,
          advancePaidAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Payment confirmation submitted successfully',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingId,
          status: updatedBooking.status,
          advancePaymentRef: updatedBooking.advancePaymentRef,
          type: 'wander_quote',
        },
      });
    }

    // No booking found
    return NextResponse.json(
      { error: 'Booking not found' },
      { status: 404 }
    );
  } catch (error: any) {
    logger.error('Payment confirmation error', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment', details: error?.message },
      { status: 500 }
    );
  }
}
