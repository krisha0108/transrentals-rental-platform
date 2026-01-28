// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get single Self-Drive car booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to find by ID first, then by booking number
    let booking = await prisma.car_bookings.findUnique({
      where: { id },
      include: {
        locations: { select: { id: true, name: true, slug: true } },
        customers: { select: { id: true, name: true, email: true, phone: true } },
        vendors_car_bookings_acceptedVendorIdTovendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            email: true,
            address: true,
            rating: true,
          },
        },
      },
    });

    // If not found by ID, try by booking number
    if (!booking) {
      booking = await prisma.car_bookings.findUnique({
        where: { bookingNumber: id },
        include: {
          locations: { select: { id: true, name: true, slug: true } },
          customers: { select: { id: true, name: true, email: true, phone: true } },
          vendors_car_bookings_acceptedVendorIdTovendors: {
            select: {
              id: true,
              businessName: true,
              phone: true,
              email: true,
              address: true,
              rating: true,
            },
          },
        },
      });
    }

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        vehicleName: booking.requestedVehicleName,
        vehicleType: booking.requestedVehicleType,
        chauffeur_vehicle_categories: booking.requestedCategory,
        brand: booking.requestedBrand,
        transmission: booking.requestedTransmission,
        fuelType: booking.requestedFuelType,
        seats: booking.requestedSeats,
        location: booking.locations,
        locationName: booking.locations?.name || null,
        pickupAddress: booking.pickupAddress,
        dropAddress: booking.dropAddress,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        dropDate: booking.dropDate,
        dropTime: booking.dropTime,
        totalDays: booking.totalDays,
        dailyRate: booking.dailyRate,
        baseAmount: booking.baseAmount,
        gstAmount: booking.gstAmount,
        platformFee: booking.platformFee,
        grandTotal: booking.grandTotal,
        securityDeposit: booking.securityDeposit,
        advanceAmount: booking.advanceAmount || 0,
        advancePercentage: booking.advancePercentage || 30,
        paidAmount: booking.paidAmount || 0,
        kmLimitPerDay: booking.kmLimitPerDay,
        extraKmRate: booking.extraKmRate,
        odometerStart: booking.odometerStart,
        odometerEnd: booking.odometerEnd,
        extraKmCharges: booking.extraKmCharges,
        customerNotes: booking.customerNotes,
        vendorNotes: booking.vendorNotes || null,
        tripStartOtp: booking.tripStartOtp || null,
        tripOtpVerified: booking.tripOtpVerified || false,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        transactionId: booking.transactionId,
        vendor: booking.vendors_car_bookings_acceptedVendorIdTovendors
          ? {
              id: booking.vendors_car_bookings_acceptedVendorIdTovendors.id,
              name: booking.vendors_car_bookings_acceptedVendorIdTovendors.businessName,
              businessName: booking.vendors_car_bookings_acceptedVendorIdTovendors.businessName,
              phone: booking.vendors_car_bookings_acceptedVendorIdTovendors.phone,
              email: booking.vendors_car_bookings_acceptedVendorIdTovendors.email,
              address: booking.vendors_car_bookings_acceptedVendorIdTovendors.address,
              rating: booking.vendors_car_bookings_acceptedVendorIdTovendors.rating,
            }
          : null,
        responseDeadline: booking.responseDeadline,
        broadcastedAt: booking.broadcastedAt,
        acceptedAt: booking.acceptedAt,
        pickedUpAt: booking.pickedUpAt,
        returnedAt: booking.returnedAt,
        completedAt: booking.completedAt,
        cancelledAt: booking.cancelledAt,
        cancellationReason: booking.cancellationReason,
        rating: booking.rating,
        review: booking.review,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch car booking', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update Self-Drive car booking (cancel, rate, update odometer, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason, rating, review, odometerStart, odometerEnd } = body;

    const booking = await prisma.car_bookings.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Cancel booking
    if (action === 'cancel') {
      const nonCancellableStatuses = ['COMPLETED', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'IN_PROGRESS'];
      if (nonCancellableStatuses.includes(booking.status)) {
        return NextResponse.json(
          { error: 'This booking cannot be cancelled' },
          { status: 400 }
        );
      }

      const updatedBooking = await prisma.car_bookings.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason || 'Cancelled by customer',
          cancelledBy: 'CUSTOMER',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Booking cancelled successfully',
        booking: {
          id: updatedBooking.id,
          status: updatedBooking.status,
        },
      });
    }

    // Rate booking
    if (action === 'rate') {
      if (booking.status !== 'COMPLETED') {
        return NextResponse.json(
          { error: 'Can only rate completed bookings' },
          { status: 400 }
        );
      }

      const updatedBooking = await prisma.car_bookings.update({
        where: { id },
        data: {
          rating,
          review,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Rating submitted successfully',
        booking: {
          id: updatedBooking.id,
          rating: updatedBooking.rating,
          review: updatedBooking.review,
        },
      });
    }

    // Start trip (pickup)
    if (action === 'start_trip') {
      if (booking.status !== 'ACCEPTED') {
        return NextResponse.json(
          { error: 'Booking must be accepted to start trip' },
          { status: 400 }
        );
      }

      const updatedBooking = await prisma.car_bookings.update({
        where: { id },
        data: {
          status: 'IN_PROGRESS',
          pickedUpAt: new Date(),
          odometerStart: odometerStart || null,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Trip started successfully',
        booking: {
          id: updatedBooking.id,
          status: updatedBooking.status,
          odometerStart: updatedBooking.odometerStart,
        },
      });
    }

    // Complete trip (return)
    if (action === 'complete_trip') {
      if (booking.status !== 'IN_PROGRESS') {
        return NextResponse.json(
          { error: 'Booking must be in progress to complete' },
          { status: 400 }
        );
      }

      // Calculate extra km charges if applicable
      let extraKmCharges = 0;
      if (odometerEnd && booking.odometerStart) {
        const totalKm = odometerEnd - booking.odometerStart;
        const allowedKm = booking.kmLimitPerDay * booking.totalDays;
        if (totalKm > allowedKm) {
          extraKmCharges = (totalKm - allowedKm) * booking.extraKmRate;
        }
      }

      const updatedBooking = await prisma.car_bookings.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          returnedAt: new Date(),
          completedAt: new Date(),
          odometerEnd: odometerEnd || null,
          extraKmCharges,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Trip completed successfully',
        booking: {
          id: updatedBooking.id,
          status: updatedBooking.status,
          odometerEnd: updatedBooking.odometerEnd,
          extraKmCharges: updatedBooking.extraKmCharges,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    logger.error('Failed to update car booking', error);
    return NextResponse.json(
      { error: 'Failed to update booking', details: error?.message },
      { status: 500 }
    );
  }
}
