// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get Luxury Booking details (supports new quote-based flow)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let booking = await prisma.luxury_bookings.findUnique({
      where: { id },
      include: {
        locations: { select: { name: true, slug: true } },
        luxury_quote_requests: {
          select: {
            id: true,
            requestNumber: true,
            vehicleCategory: true,
            vehicleCategoryName: true,
            tripType: true,
            occasion: true,
            requirements: true,
          },
        },
        luxury_quotes: {
          select: {
            id: true,
            quoteNumber: true,
            vehicleName: true,
            vehicleNumber: true,
            vehicleModel: true,
            vehicleYear: true,
            vehicleFeatures: true,
            vehicleImages: true,
            driverName: true,
            driverPhone: true,
            driverExperience: true,
            baseAmount: true,
            chauffeurCharges: true,
            decorationCharges: true,
            gstAmount: true,
            totalAmount: true,
            advanceAmount: true,
            advancePercent: true,
            inclusions: true,
            exclusions: true,
            termsConditions: true,
            vendorMessage: true,
            vendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                rating: true,
              },
            },
          },
        },
        vendors_luxury_bookings_assignedVendorIdTovendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            rating: true,
          },
        },
        vendors_luxury_bookings_acceptedVendorIdTovendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            rating: true,
          },
        },
      },
    });

    // Also try by booking number
    if (!booking) {
      booking = await prisma.luxury_bookings.findFirst({
        where: { bookingNumber: id },
        include: {
          locations: { select: { name: true, slug: true } },
          luxury_quote_requests: {
            select: {
              id: true,
              requestNumber: true,
              vehicleCategory: true,
              vehicleCategoryName: true,
              tripType: true,
              occasion: true,
              requirements: true,
            },
          },
          luxury_quotes: {
            select: {
              id: true,
              quoteNumber: true,
              vehicleName: true,
              vehicleNumber: true,
              vehicleModel: true,
              vehicleYear: true,
              vehicleFeatures: true,
              vehicleImages: true,
              driverName: true,
              driverPhone: true,
              driverExperience: true,
              baseAmount: true,
              chauffeurCharges: true,
              decorationCharges: true,
              gstAmount: true,
              totalAmount: true,
              advanceAmount: true,
              advancePercent: true,
              inclusions: true,
              exclusions: true,
              termsConditions: true,
              vendorMessage: true,
              vendors: {
                select: {
                  id: true,
                  businessName: true,
                  phone: true,
                  rating: true,
                },
              },
            },
          },
          vendors_luxury_bookings_assignedVendorIdTovendors: {
            select: {
              id: true,
              businessName: true,
              phone: true,
              rating: true,
            },
          },
          vendors_luxury_bookings_acceptedVendorIdTovendors: {
            select: {
              id: true,
              businessName: true,
              phone: true,
              rating: true,
            },
          },
        },
      });
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get vendor from either acceptedVendor or assignedVendor
    const vendor = booking.vendors_luxury_bookings_acceptedVendorIdTovendors || booking.vendors_luxury_bookings_assignedVendorIdTovendors;

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        customerId: booking.customerId,
        tripType: booking.tripType,
        occasion: booking.occasion,
        carCategory: booking.carCategory,
        carCategoryName: booking.carCategoryName,
        vehicleName: booking.luxury_quotes?.vehicleName || booking.vehicleModel,
        vehicleNumber: booking.vehicleNumber,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        customerEmail: booking.customerEmail,
        pickupCity: booking.pickupCity,
        pickupAddress: booking.pickupAddress,
        dropCity: booking.dropCity,
        dropAddress: booking.dropAddress,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        returnDate: booking.returnDate,
        tripDays: booking.totalDays,
        tripHours: booking.totalHours,
        needDecoration: booking.needDecoration,
        decorationType: booking.decorationType,
        requirements: booking.customerNotes || booking.luxury_quote_requests?.requirements,
        // Pricing
        baseAmount: booking.baseFare,
        chauffeurCharges: booking.chauffeurCharges,
        decorationCharges: booking.decorationCharges,
        gstAmount: booking.gstAmount,
        grandTotal: booking.grandTotal,
        advanceAmount: booking.advanceAmount,
        advancePercent: booking.advancePercent || 30,
        balanceAmount: booking.grandTotal - (booking.advanceAmount || 0),
        advancePaid: booking.advancePaid || 0,
        // Status
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        // Driver
        driverName: booking.driverName,
        driverPhone: booking.driverPhone,
        // OTPs
        tripStartOtp: booking.tripStartOtp,
        tripEndOtp: booking.tripEndOtp,
        // Rating
        rating: booking.rating,
        review: booking.review,
        // Relations
        vendor,
        quote: booking.luxury_quotes || null,
        quoteRequest: booking.luxury_quote_requests,
        location: booking.locations,
        createdAt: booking.createdAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch luxury booking', error);
    return NextResponse.json({ error: 'Failed to fetch booking', details: error?.message }, { status: 500 });
  }
}

// PATCH - Update Luxury Booking (cancel, rate, submit payment)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;

    const booking = await prisma.luxury_bookings.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    switch (action) {
      case 'submit_payment': {
        // Customer submits advance payment proof
        if (booking.status !== 'PENDING_PAYMENT') {
          return NextResponse.json({ error: 'Payment not expected in current status' }, { status: 400 });
        }

        const { paymentMethod, transactionId, paymentProof } = data;

        const updatedBooking = await prisma.luxury_bookings.update({
          where: { id },
          data: {
            status: 'PAYMENT_SUBMITTED',
            paymentStatus: 'SUBMITTED',
            paymentMethod: paymentMethod || 'ONLINE',
            paymentTransactionId: transactionId || null,
            paymentProof: paymentProof || null,
            paymentSubmittedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Payment submitted! We will verify and confirm your booking shortly.',
          booking: {
            id: updatedBooking.id,
            bookingNumber: updatedBooking.bookingNumber,
            status: updatedBooking.status,
          },
        });
      }

      case 'cancel': {
        if (!['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED'].includes(booking.status)) {
          return NextResponse.json({ error: 'This booking cannot be cancelled' }, { status: 400 });
        }
        const { reason } = data;
        let refundAmount = 0;
        const advancePaid = booking.advancePaid || 0;

        if (advancePaid > 0) {
          const hoursUntilPickup = (new Date(booking.pickupDate).getTime() - Date.now()) / (1000 * 60 * 60);
          if (hoursUntilPickup > 24) refundAmount = advancePaid * 0.9;
          else if (hoursUntilPickup > 6) refundAmount = advancePaid * 0.5;
        }

        const updatedBooking = await prisma.luxury_bookings.update({
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
          message: 'Booking cancelled',
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
          return NextResponse.json({ error: 'Can only rate completed bookings' }, { status: 400 });
        }
        const { rating, review } = data;
        if (!rating || rating < 1 || rating > 5) {
          return NextResponse.json({ error: 'Valid rating (1-5) is required' }, { status: 400 });
        }

        const updatedBooking = await prisma.luxury_bookings.update({
          where: { id },
          data: {
            rating,
            review: review || null,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Rating submitted',
          booking: { id: updatedBooking.id, rating: updatedBooking.rating },
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Failed to update luxury booking', error);
    return NextResponse.json({ error: 'Failed to update booking', details: error?.message }, { status: 500 });
  }
}
