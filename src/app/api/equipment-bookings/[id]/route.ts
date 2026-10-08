// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
import { updateVendorRating, parseStarRating } from '@/lib/utils/update-vendor-rating';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
import { openRefundFollowup } from '@/lib/refunds/refund-followup';
export const dynamic = 'force-dynamic';

// GET - Get Equipment Booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let booking = await prisma.equipment_bookings.findUnique({
      where: { id },
      include: {
        vendors: { select: { id: true, businessName: true, phone: true, rating: true } },
        equipment_quote_requests: { select: { id: true, requestNumber: true } },
        equipment_quotes: {
          select: {
            id: true,
            quoteNumber: true,
            equipmentName: true,
            equipmentModel: true,
            equipmentYear: true,
            specifications: true,
            dailyRate: true,
            baseAmount: true,
            operatorCharges: true,
            deliveryCharges: true,
            pickupCharges: true,
            installationCharges: true,
            securityDeposit: true,
            gstAmount: true,
            totalAmount: true,
            advanceAmount: true,
            advancePercent: true,
            inclusions: true,
            exclusions: true,
            termsConditions: true,
            notes: true,
          }
        },
      },
    });

    if (!booking) {
      booking = await prisma.equipment_bookings.findUnique({
        where: { bookingNumber: id },
        include: {
          vendors: { select: { id: true, businessName: true, phone: true, rating: true } },
          equipment_quote_requests: { select: { id: true, requestNumber: true } },
          equipment_quotes: {
            select: {
              id: true,
              quoteNumber: true,
              equipmentName: true,
              equipmentModel: true,
              equipmentYear: true,
              specifications: true,
              dailyRate: true,
              baseAmount: true,
              operatorCharges: true,
              deliveryCharges: true,
              pickupCharges: true,
              installationCharges: true,
              securityDeposit: true,
              gstAmount: true,
              totalAmount: true,
              inclusions: true,
              exclusions: true,
              termsConditions: true,
              notes: true,
            }
          },
        },
      });
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Transform booking for frontend compatibility
    const dailyRate = booking.rentalDays > 0 ? Math.round(booking.baseAmount / booking.rentalDays) : 0;
    const additionalCharges = (booking.operatorCharges || 0) + (booking.deliveryCharges || 0) + (booking.pickupCharges || 0) + (booking.installationCharges || 0);

    const quoteAdvanceEq = booking.equipment_quotes?.advanceAmount;
    const transformedBooking = {
      ...booking,
      advanceAmount: (quoteAdvanceEq != null && quoteAdvanceEq > 0) ? quoteAdvanceEq : booking.advanceAmount,
      balanceAmount: booking.totalAmount - ((quoteAdvanceEq != null && quoteAdvanceEq > 0) ? quoteAdvanceEq : booking.advanceAmount),
      deliveryLocation: booking.deliveryCity,
      dailyRate,
      additionalCharges,
      vendor: booking.vendors ? {
        id: booking.vendors.id,
        name: booking.vendors.businessName,
        phone: booking.vendors.phone,
        rating: booking.vendors.rating || 0,
      } : null,
      operator: booking.operatorName ? {
        name: booking.operatorName,
        phone: booking.operatorPhone,
      } : null,
      quote: booking.equipment_quotes || null,
    };

    return NextResponse.json({ success: true, booking: transformedBooking });
  } catch (error: any) {
    logger.error('Failed to fetch equipment booking', error);
    return NextResponse.json({ error: 'Failed to fetch booking', details: error?.message }, { status: 500 });
  }
}

// PATCH - Update Equipment Booking (cancel, rate, extend)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, ...data } = body;

    const booking = await prisma.equipment_bookings.findUnique({ where: { id } });
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
        let refundPolicyNote: string | null = null;
        if (booking.advancePaid > 0) {
          const daysUntilStart = Math.ceil((new Date(booking.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysUntilStart > 3) {
            refundAmount = booking.advancePaid * 0.9;
            refundPolicyNote = '90% refund — cancelled more than 3 days before start.';
          } else if (daysUntilStart > 1) {
            refundAmount = booking.advancePaid * 0.5;
            refundPolicyNote = '50% refund — cancelled 1–3 days before start.';
          } else {
            refundPolicyNote = 'no refund — cancelled within 1 day of start.';
          }
        }

        const updatedBooking = await prisma.equipment_bookings.update({
          where: { id },
          data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: 'CUSTOMER', cancellationReason: reason || 'Cancelled by customer', refundAmount },
        });


        // Non-blocking: the vendor has kit set aside for this job.
        if (booking.vendorId) {
          sendVendorDirectNotification({
            vendorId: booking.vendorId,
            title: 'Booking cancelled by customer',
            body: `Booking #${booking.bookingNumber} was cancelled. Reason: ${reason || 'not given'}.`,
            type: 'booking_cancelled',
            serviceType: 'equipment',
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
          }).catch((err: unknown) => console.error('[Cancel] vendor notification failed:', err));
        }

        // Money owed goes on the refunds queue and the desk is told. Never
        // blocks the cancellation.
        openRefundFollowup({
          source: 'equipment_bookings',
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          serviceType: 'Equipment Rental',
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
        const { rating, review, equipmentRating } = data;
        const stars = parseStarRating(rating);
        if (!stars) {
          return NextResponse.json({ error: 'Valid rating (1-5) is required' }, { status: 400 });
        }

        // Only an unrated row is written, so a double submit cannot count twice.
        const { count } = await prisma.equipment_bookings.updateMany({
          where: { id, rating: null },
          data: { rating: stars, review: review || null, equipmentRating: parseStarRating(equipmentRating) ?? stars },
        });
        if (!count) {
          return NextResponse.json({ success: false, error: 'You have already rated this trip' }, { status: 400 });
        }

        updateVendorRating(booking.vendorId, stars).catch(() => {});

        return NextResponse.json({ success: true, message: 'Rating submitted', booking: { id: booking.id, rating: stars } });
      }

      case 'extend': {
        if (!['DELIVERED', 'ON_RENT'].includes(booking.status)) {
          return NextResponse.json({ error: 'Can only extend active rentals' }, { status: 400 });
        }
        const { newEndDate, additionalAmount, extensionDays } = data;
        if (!newEndDate || !additionalAmount) {
          return NextResponse.json({ error: 'New end date and additional amount required' }, { status: 400 });
        }

        const updatedBooking = await prisma.equipment_bookings.update({
          where: { id },
          data: {
            endDate: new Date(newEndDate),
            totalAmount: { increment: additionalAmount },
            balanceAmount: { increment: additionalAmount },
            isExtended: true,
            extensionDays: extensionDays || null,
            extensionCharges: additionalAmount,
          },
        });

        return NextResponse.json({ success: true, message: 'Rental extended', booking: { id: updatedBooking.id, endDate: updatedBooking.endDate, totalAmount: updatedBooking.totalAmount } });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Failed to update equipment booking', error);
    return NextResponse.json({ error: 'Failed to update booking', details: error?.message }, { status: 500 });
  }
}
