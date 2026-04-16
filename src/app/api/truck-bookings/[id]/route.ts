// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { updateVendorRating } from '@/lib/utils/update-vendor-rating';

export const dynamic = 'force-dynamic';

// GET - Get Truck Booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let booking = await prisma.truck_bookings.findUnique({
      where: { id },
      include: {
        vendors: { select: { id: true, businessName: true, phone: true, rating: true } },
        truck_quote_requests: { select: { id: true, requestNumber: true } },
        truck_quotes: {
          select: {
            id: true,
            quoteNumber: true,
            vehicleCategory: true,
            vehicleName: true,
            vehicleNumber: true,
            vehicleCapacity: true,
            driverName: true,
            driverPhone: true,
            labourIncluded: true,
            labourCount: true,
            labourCharges: true,
            baseAmount: true,
            perKmRate: true,
            loadingCharges: true,
            unloadingCharges: true,
            packagingCharges: true,
            insuranceCharges: true,
            tollEstimate: true,
            gstAmount: true,
            totalAmount: true,
            advanceAmount: true,
            advancePercent: true,
            inclusions: true,
            exclusions: true,
            termsConditions: true,
          }
        },
      },
    });

    if (!booking) {
      booking = await prisma.truck_bookings.findUnique({
        where: { bookingNumber: id },
        include: {
          vendors: { select: { id: true, businessName: true, phone: true, rating: true } },
          truck_quote_requests: { select: { id: true, requestNumber: true } },
          truck_quotes: {
            select: {
              id: true,
              quoteNumber: true,
              vehicleCategory: true,
              vehicleName: true,
              vehicleNumber: true,
              vehicleCapacity: true,
              driverName: true,
              driverPhone: true,
              labourIncluded: true,
              labourCount: true,
              labourCharges: true,
              baseAmount: true,
              perKmRate: true,
              loadingCharges: true,
              unloadingCharges: true,
              packagingCharges: true,
              insuranceCharges: true,
              tollEstimate: true,
              gstAmount: true,
              totalAmount: true,
              inclusions: true,
              exclusions: true,
              termsConditions: true,
            }
          },
        },
      });
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Transform booking to include quote with the expected property name
    const quoteAdvance = booking.truck_quotes?.advanceAmount;
    const transformedBooking = {
      ...booking,
      // Use vendor-set advanceAmount from quote if available (overrides booking record)
      advanceAmount: (quoteAdvance != null && quoteAdvance > 0) ? quoteAdvance : booking.advanceAmount,
      balanceAmount: booking.totalAmount - ((quoteAdvance != null && quoteAdvance > 0) ? quoteAdvance : booking.advanceAmount),
      vendor: booking.vendors ? {
        id: booking.vendors.id,
        name: booking.vendors.businessName,
        phone: booking.vendors.phone,
        rating: booking.vendors.rating,
      } : null,
      quote: booking.truck_quotes || null,
      quoteRequest: booking.truck_quote_requests || null,
    };

    return NextResponse.json({ success: true, booking: transformedBooking });
  } catch (error: any) {
    logger.error('Failed to fetch truck booking', error);
    return NextResponse.json({ error: 'Failed to fetch booking', details: error?.message }, { status: 500 });
  }
}

// PATCH - Update Truck Booking (cancel, rate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;

    const booking = await prisma.truck_bookings.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    switch (action) {
      case 'cancel': {
        if (!['PENDING_PAYMENT', 'ADVANCE_PAID', 'CONFIRMED'].includes(booking.status)) {
          return NextResponse.json({ error: 'This booking cannot be cancelled' }, { status: 400 });
        }
        const { reason } = data;
        let refundAmount = 0;
        if (booking.advancePaid > 0) {
          const daysUntilTrip = Math.ceil((new Date(booking.pickupDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysUntilTrip > 3) refundAmount = booking.advancePaid * 0.8;
          else if (daysUntilTrip > 1) refundAmount = booking.advancePaid * 0.5;
        }

        const updatedBooking = await prisma.truck_bookings.update({
          where: { id },
          data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'CUSTOMER', cancellationReason: reason || 'Cancelled by customer', refundAmount },
        });

        return NextResponse.json({ success: true, message: 'Booking cancelled', booking: { id: updatedBooking.id, bookingNumber: updatedBooking.bookingNumber, status: updatedBooking.status, refundAmount } });
      }

      case 'rate': {
        if (booking.status !== 'COMPLETED') {
          return NextResponse.json({ error: 'Can only rate completed bookings' }, { status: 400 });
        }
        const { rating, review, driverRating } = data;
        if (!rating || rating < 1 || rating > 5) {
          return NextResponse.json({ error: 'Valid rating (1-5) is required' }, { status: 400 });
        }

        const updatedBooking = await prisma.truck_bookings.update({
          where: { id },
          data: { rating, review: review || null, driverRating: driverRating || rating },
        });

        updateVendorRating(booking.vendorId, rating).catch(() => {});

        return NextResponse.json({ success: true, message: 'Rating submitted', booking: { id: updatedBooking.id, rating: updatedBooking.rating } });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Failed to update truck booking', error);
    return NextResponse.json({ error: 'Failed to update booking', details: error?.message }, { status: 500 });
  }
}
