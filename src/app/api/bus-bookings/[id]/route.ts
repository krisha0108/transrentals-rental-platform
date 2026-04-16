// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
import { updateVendorRating } from '@/lib/utils/update-vendor-rating';
export const dynamic = 'force-dynamic';

// GET - Get Bus Booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to find by ID first, then by booking number
    let booking = await prisma.bus_bookings.findUnique({
      where: { id },
      include: {
        vendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            rating: true,
          },
        },
        bus_quote_requests: {
          select: {
            id: true,
            requestNumber: true,
            tripType: true,
            requirements: true,
          },
        },
        bus_quotes: {
          select: {
            id: true,
            quoteNumber: true,
            validTill: true,
            vehicleCategory: true,
            vehicleName: true,
            vehicleNumber: true,
            vehicleModel: true,
            vehicleYear: true,
            seats: true,
            vehicleFeatures: true,
            vehicleImages: true,
            driverName: true,
            driverPhone: true,
            driverExperience: true,
            baseAmount: true,
            perKmRate: true,
            perDayRate: true,
            includedKm: true,
            includedHours: true,
            driverAllowance: true,
            nightHaltCharges: true,
            tollEstimate: true,
            permitCharges: true,
            parkingEstimate: true,
            gstAmount: true,
            totalAmount: true,
            extraKmRate: true,
            extraHourRate: true,
            inclusions: true,
            exclusions: true,
            termsConditions: true,
            vendorMessage: true,
            advanceAmount: true,
            advancePercent: true,
          },
        },
      },
    });

    // If not found by ID, try by booking number
    if (!booking) {
      booking = await prisma.bus_bookings.findUnique({
        where: { bookingNumber: id },
        include: {
          vendors: {
            select: {
              id: true,
              businessName: true,
              phone: true,
              rating: true,
            },
          },
          quoteRequest: {
            select: {
              id: true,
              requestNumber: true,
              tripType: true,
              requirements: true,
            },
          },
          acceptedQuote: {
            select: {
              id: true,
              quoteNumber: true,
              validTill: true,
              chauffeur_vehicle_categories: true,
              vehicleName: true,
              vehicleNumber: true,
              vehicle_models: true,
              vehicleYear: true,
              seats: true,
              vehicleFeatures: true,
              vehicleImages: true,
              driverName: true,
              driverPhone: true,
              driverExperience: true,
              baseAmount: true,
              perKmRate: true,
              perDayRate: true,
              includedKm: true,
              includedHours: true,
              driverAllowance: true,
              nightHaltCharges: true,
              tollEstimate: true,
              permitCharges: true,
              parkingEstimate: true,
              gstAmount: true,
              totalAmount: true,
              extraKmRate: true,
              extraHourRate: true,
              inclusions: true,
              exclusions: true,
              termsConditions: true,
              vendorMessage: true,
              advanceAmount: true,
              advancePercent: true,
            },
          },
        },
      });
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        customerId: booking.customerId,
        tripType: booking.tripType,
        vehicleCategory: booking.vehicleCategory,
        vehicleName: booking.vehicleName,
        passengers: booking.passengers,
        pickupCity: booking.pickupCity,
        pickupAddress: booking.pickupAddress,
        dropCity: booking.dropCity,
        dropAddress: booking.dropAddress,
        routeDetails: booking.routeDetails,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        returnDate: booking.returnDate,
        returnTime: booking.returnTime,
        tripDays: booking.tripDays,
        // Pricing
        baseAmount: booking.baseAmount,
        additionalCharges: booking.additionalCharges,
        gstAmount: booking.gstAmount,
        totalAmount: booking.totalAmount,
        // Payment
        advanceAmount: (booking.bus_quotes?.advanceAmount != null && booking.bus_quotes.advanceAmount > 0) ? booking.bus_quotes.advanceAmount : booking.advanceAmount,
        advancePaid: booking.advancePaid,
        advancePaidAt: booking.advancePaidAt,
        balanceAmount: booking.balanceAmount,
        balancePaid: booking.balancePaid,
        balancePaidAt: booking.balancePaidAt,
        paymentStatus: booking.paymentStatus,
        // Status
        status: booking.status,
        // Vehicle & Driver
        vehicleNumber: booking.vehicleNumber,
        vehicleModel: booking.vehicleModel,
        driverName: booking.driverName,
        driverPhone: booking.driverPhone,
        driverPhoto: booking.driverPhoto,
        // OTP
        tripStartOtp: booking.tripStartOtp,
        tripEndOtp: booking.tripEndOtp,
        // Trip tracking
        tripStartedAt: booking.tripStartedAt,
        tripEndedAt: booking.tripEndedAt,
        actualKmTravelled: booking.actualKmTravelled,
        actualDays: booking.actualDays,
        // Extra charges
        extraKmCharges: booking.extraKmCharges,
        extraDayCharges: booking.extraDayCharges,
        tollCharges: booking.tollCharges,
        parkingCharges: booking.parkingCharges,
        otherCharges: booking.otherCharges,
        finalAmount: booking.finalAmount,
        // Notes
        customerNotes: booking.customerNotes,
        vendorNotes: booking.vendorNotes,
        // Cancellation
        cancelledAt: booking.cancelledAt,
        cancelledBy: booking.cancelledBy,
        cancellationReason: booking.cancellationReason,
        // Rating
        rating: booking.rating,
        review: booking.review,
        driverRating: booking.driverRating,
        vehicleRating: booking.vehicleRating,
        // Vendor
        vendor: booking.vendors
          ? {
              id: booking.vendors.id,
              name: booking.vendors.businessName,
              phone: booking.vendors.phone,
              rating: booking.vendors.rating,
            }
          : null,
        // Quote details
        quoteRequest: booking.bus_quote_requests,
        quote: booking.bus_quotes || null,
        // Timestamps
        confirmedAt: booking.confirmedAt,
        completedAt: booking.completedAt,
        createdAt: booking.createdAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch bus booking', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update Bus Booking (cancel, rate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;

    const booking = await prisma.bus_bookings.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Handle different actions
    switch (action) {
      case 'cancel': {
        if (!['PENDING_PAYMENT', 'ADVANCE_PAID', 'CONFIRMED', 'VEHICLE_ASSIGNED'].includes(booking.status)) {
          return NextResponse.json(
            { error: 'This booking cannot be cancelled' },
            { status: 400 }
          );
        }

        const { reason } = data;

        // Calculate refund if advance was paid
        let refundAmount = 0;
        if (booking.advancePaid > 0) {
          // Simple refund logic - can be customized based on cancellation policy
          const daysUntilTrip = Math.ceil(
            (new Date(booking.pickupDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntilTrip > 7) {
            refundAmount = booking.advancePaid * 0.9; // 90% refund
          } else if (daysUntilTrip > 3) {
            refundAmount = booking.advancePaid * 0.5; // 50% refund
          } else {
            refundAmount = 0; // No refund for last-minute cancellations
          }
        }

        const updatedBooking = await prisma.bus_bookings.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelledBy: 'CUSTOMER',
            cancellationReason: reason || 'Cancelled by customer',
            refundAmount,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Booking cancelled successfully',
          booking: {
            id: updatedBooking.id,
            bookingNumber: updatedBooking.bookingNumber,
            status: updatedBooking.status,
            refundAmount,
          },
        });
      }

      case 'rate': {
        if (booking.status !== 'COMPLETED') {
          return NextResponse.json(
            { error: 'Can only rate completed bookings' },
            { status: 400 }
          );
        }

        const { rating, review, driverRating, vehicleRating } = data;

        if (!rating || rating < 1 || rating > 5) {
          return NextResponse.json(
            { error: 'Valid rating (1-5) is required' },
            { status: 400 }
          );
        }

        const updatedBooking = await prisma.bus_bookings.update({
          where: { id },
          data: {
            rating,
            review: review || null,
            driverRating: driverRating || rating,
            vehicleRating: vehicleRating || rating,
          },
        });

        updateVendorRating(booking.vendorId, rating).catch(() => {});

        return NextResponse.json({
          success: true,
          message: 'Rating submitted successfully',
          booking: {
            id: updatedBooking.id,
            bookingNumber: updatedBooking.bookingNumber,
            rating: updatedBooking.rating,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    logger.error('Failed to update bus booking', error);
    return NextResponse.json(
      { error: 'Failed to update booking', details: error?.message },
      { status: 500 }
    );
  }
}
