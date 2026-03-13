import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Fetch booking by booking number or ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingNumber: string }> | { bookingNumber: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params;
    const { bookingNumber } = resolvedParams;

    // Try to find by ID first, then by booking number
    let booking = await prisma.chauffeur_bookings.findUnique({
      where: { id: bookingNumber },
      include: {
        locations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }).catch(() => null);

    // If not found by ID, try by booking number
    if (!booking) {
      booking = await prisma.chauffeur_bookings.findUnique({
        where: { bookingNumber },
        include: {
          locations: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        customerId: booking.customerId,
        acceptedVendorId: booking.acceptedVendorId,
        tripType: booking.tripType,
        carCategory: booking.carCategory,
        carCategoryName: booking.carCategoryName,
        pickupCity: booking.pickupCity,
        dropCity: booking.dropCity,
        pickupAddress: booking.pickupAddress,
        dropAddress: booking.dropAddress,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        returnDate: booking.returnDate,
        totalDays: booking.totalDays,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        baseFare: booking.baseFare,
        gstAmount: booking.gstAmount,
        platformFee: booking.platformFee,
        grandTotal: booking.grandTotal,
        advanceAmount: booking.advanceAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paidAmount: booking.paidAmount,
        driverName: booking.driverName,
        driverPhone: booking.driverPhone,
        vehicleNumber: booking.vehicleNumber,
        vehicle_models: booking.vehicle_models,
        tripStartOtp: booking.tripStartOtp,
        tripStartedAt: booking.tripStartedAt,
        tripEndedAt: booking.tripEndedAt,
        rating: booking.rating,
        review: booking.review,
        cancelledAt: booking.cancelledAt,
        cancellationReason: booking.cancellationReason,
        droppedAt: booking.droppedAt,
        dropReason: booking.dropReason,
        createdAt: booking.createdAt,
        location: booking.locations,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch booking', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update booking (cancel, rate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingNumber: string }> | { bookingNumber: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params;
    const { bookingNumber } = resolvedParams;
    const body = await request.json();
    const { action } = body;

    // Find the booking by ID first, then by booking number
    let booking = await prisma.chauffeur_bookings.findUnique({
      where: { id: bookingNumber },
    }).catch(() => null);

    if (!booking) {
      booking = await prisma.chauffeur_bookings.findUnique({
        where: { bookingNumber },
      });
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'cancel': {
        // Check if booking can be cancelled
        const cancellableStatuses = ['PENDING_PAYMENT', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'DRIVER_ASSIGNED'];
        if (!cancellableStatuses.includes(booking.status)) {
          return NextResponse.json(
            { success: false, error: 'Booking cannot be cancelled at this stage' },
            { status: 400 }
          );
        }

        const updatedBooking = await prisma.chauffeur_bookings.update({
          where: { id: booking.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancellationReason: body.cancellationReason || 'Customer cancelled',
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Booking cancelled successfully',
          booking: updatedBooking,
        });
      }

      case 'rate': {
        // Check if booking is completed
        if (booking.status !== 'COMPLETED') {
          return NextResponse.json(
            { success: false, error: 'Only completed bookings can be rated' },
            { status: 400 }
          );
        }

        // Check if already rated
        if (booking.rating) {
          return NextResponse.json(
            { success: false, error: 'Booking has already been rated' },
            { status: 400 }
          );
        }

        const { rating, review } = body;

        if (!rating || rating < 1 || rating > 5) {
          return NextResponse.json(
            { success: false, error: 'Rating must be between 1 and 5' },
            { status: 400 }
          );
        }

        const updatedBooking = await prisma.chauffeur_bookings.update({
          where: { id: booking.id },
          data: {
            rating: parseInt(rating),
            review: review || null,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Thank you for your feedback!',
          booking: updatedBooking,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    logger.error('Failed to update booking', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update booking', details: error?.message },
      { status: 500 }
    );
  }
}
