// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
import { updateVendorRating, parseStarRating } from '@/lib/utils/update-vendor-rating';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
import { openRefundFollowup } from '@/lib/refunds/refund-followup';
export const dynamic = 'force-dynamic';

// GET - Get Packers Booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const includeOptions = {
      vendors: { select: { id: true, businessName: true, phone: true, rating: true } },
      packers_quote_requests: true,
      packers_quotes: {
        select: {
          id: true,
          quoteNumber: true,
          vehicleType: true,
          teamSize: true,
          estimatedDuration: true,
          packingCharges: true,
          loadingCharges: true,
          transportCharges: true,
          unloadingCharges: true,
          unpackingCharges: true,
          storageCharges: true,
          insuranceCharges: true,
          materialCharges: true,
          gstAmount: true,
          totalAmount: true,
          advanceAmount: true,
          advancePercent: true,
          packingMaterials: true,
          inclusions: true,
          exclusions: true,
          termsConditions: true,
        }
      },
    };

    let booking = await prisma.packers_bookings.findUnique({
      where: { id },
      include: includeOptions,
    });

    if (!booking) {
      booking = await prisma.packers_bookings.findUnique({
        where: { bookingNumber: id },
        include: includeOptions,
      });
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Transform booking to include quote with the expected property name
    const quoteAdvancePk = booking.packers_quotes?.advanceAmount;
    const transformedBooking = {
      ...booking,
      advanceAmount: (quoteAdvancePk != null && quoteAdvancePk > 0) ? quoteAdvancePk : booking.advanceAmount,
      balanceAmount: booking.totalAmount - ((quoteAdvancePk != null && quoteAdvancePk > 0) ? quoteAdvancePk : booking.advanceAmount),
      vendor: booking.vendors ? {
        id: booking.vendors.id,
        name: booking.vendors.businessName,
        phone: booking.vendors.phone,
        rating: booking.vendors.rating,
      } : null,
      quoteRequest: booking.packers_quote_requests || null,
      quote: booking.packers_quotes || null,
    };

    return NextResponse.json({ success: true, booking: transformedBooking });
  } catch (error: any) {
    logger.error('Failed to fetch packers booking', error);
    return NextResponse.json({ error: 'Failed to fetch booking', details: error?.message }, { status: 500 });
  }
}

// PATCH - Update Packers Booking (cancel, rate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;

    const booking = await prisma.packers_bookings.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    switch (action) {
      case 'cancel': {
        if (!['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'ADVANCE_PAID', 'CONFIRMED', 'TEAM_ASSIGNED'].includes(booking.status)) {
          return NextResponse.json({ error: 'This booking cannot be cancelled' }, { status: 400 });
        }
        const { reason } = data;
        let refundAmount = 0;
        let refundPolicyNote: string | null = null;
        if (booking.advancePaid > 0) {
          const daysUntilMove = Math.ceil((new Date(booking.scheduledDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysUntilMove > 5) {
            refundAmount = booking.advancePaid * 0.9;
            refundPolicyNote = '90% refund — cancelled more than 5 days before the move.';
          } else if (daysUntilMove > 2) {
            refundAmount = booking.advancePaid * 0.5;
            refundPolicyNote = '50% refund — cancelled 2–5 days before the move.';
          } else {
            refundPolicyNote = 'no refund — cancelled within 2 days of the move.';
          }
        }

        const updatedBooking = await prisma.packers_bookings.update({
          where: { id },
          data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'CUSTOMER', cancellationReason: reason || 'Cancelled by customer', refundAmount },
        });

        // Non-blocking: the vendor has a slot held for this job.
        const cancelledVendorId = booking.vendorId;
        if (cancelledVendorId) {
          sendVendorDirectNotification({
            vendorId: cancelledVendorId,
            title: 'Booking cancelled by customer',
            body: `Booking #${booking.bookingNumber} was cancelled. Reason: ${reason || 'not given'}.`,
            type: 'booking_cancelled',
            serviceType: 'packers',
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
          }).catch((err: unknown) => console.error('[Cancel] vendor notification failed:', err));
        }

        // Money owed goes on the refunds queue and the desk is told. Never
        // blocks the cancellation.
        openRefundFollowup({
          source: 'packers_bookings',
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          serviceType: 'Packers & Movers',
          customerId: booking.customerId,
          customerName: booking.customerName,
          amount: refundAmount,
          policyNote: refundPolicyNote,
          reason,
          paidAmount: booking.advancePaid || 0,
        }).catch(() => {});

        return NextResponse.json({ success: true, message: 'Booking cancelled', booking: { id: updatedBooking.id, bookingNumber: updatedBooking.bookingNumber, status: updatedBooking.status, refundAmount } });
      }

      case 'review':
      case 'rate': {
        if (booking.status !== 'COMPLETED') {
          return NextResponse.json({ error: 'Can only rate completed bookings' }, { status: 400 });
        }
        if (booking.rating) {
          return NextResponse.json({ success: false, error: 'You have already rated this trip' }, { status: 400 });
        }
        const { rating, review, teamRating, packingRating } = data;
        const stars = parseStarRating(rating);
        if (!stars) {
          return NextResponse.json({ error: 'Valid rating (1-5) is required' }, { status: 400 });
        }

        // Only an unrated row is written, so a double submit cannot count twice.
        const { count } = await prisma.packers_bookings.updateMany({
          where: { id, rating: null },
          data: { rating: stars, review: review || null, teamRating: parseStarRating(teamRating) ?? stars, packingRating: parseStarRating(packingRating) ?? stars },
        });
        if (!count) {
          return NextResponse.json({ success: false, error: 'You have already rated this trip' }, { status: 400 });
        }

        updateVendorRating(booking.vendorId, stars).catch(() => {});

        return NextResponse.json({ success: true, message: 'Rating submitted', booking: { id: booking.id, rating: stars } });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Failed to update packers booking', error);
    return NextResponse.json({ error: 'Failed to update booking', details: error?.message }, { status: 500 });
  }
}
