import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { updateVendorRating, parseStarRating } from '@/lib/utils/update-vendor-rating';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
import { openRefundFollowup } from '@/lib/refunds/refund-followup';

export const dynamic = 'force-dynamic';

// GET - Fetch car rental booking (chauffeur_bookings)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingNumber: string }> | { bookingNumber: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params;
    const { bookingNumber } = resolvedParams;

    const booking = await prisma.chauffeur_bookings.findFirst({
      where: { OR: [{ id: bookingNumber }, { bookingNumber }] },
      include: {
        locations: { select: { id: true, name: true, slug: true } },
        vendors_chauffeur_bookings_acceptedVendorIdTovendors: {
          select: { id: true, businessName: true, ownerName: true, phone: true, logo: true, city: true, rating: true },
        },
        accepted_driver: {
          select: { id: true, name: true, phone: true, profilePhoto: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const acceptedVendor = (booking as any).vendors_chauffeur_bookings_acceptedVendorIdTovendors;
    const acceptedDriver = (booking as any).accepted_driver;

    // Only a cancelled booking ever has a refund_followups row (see
    // openRefundFollowup). The customer sees "in process" until a manager
    // has actually decided on an amount — no made-up number before that.
    const refundFollowup =
      booking.status === 'CANCELLED'
        ? await prisma.refund_followups.findUnique({
            where: { source_bookingId: { source: 'chauffeur_bookings', bookingId: booking.id } },
            select: { status: true, amount: true, approvedAmount: true, customerRefundApproved: true },
          })
        : null;

    let intermediateStops: any[] = [];
    try {
      if (booking.intermediateStops) {
        const parsed = JSON.parse(booking.intermediateStops);
        if (Array.isArray(parsed)) intermediateStops = parsed;
      }
    } catch { /* malformed/legacy data — treat as no stops */ }

    // Driver name/phone: prefer drivers table (independent driver), fallback to booking fields (staff driver)
    const resolvedDriverName  = acceptedDriver?.name  ?? booking.driverName  ?? null;
    const resolvedDriverPhone = acceptedDriver?.phone ?? booking.driverPhone ?? null;
    const resolvedDriverPhoto = acceptedDriver?.profilePhoto ?? null;

    return NextResponse.json({
      success: true,
      booking: {
        id:              booking.id,
        bookingNumber:   booking.bookingNumber,
        customerId:      booking.customerId,
        customerName:    booking.customerName,
        customerEmail:   booking.customerEmail,
        customerPhone:   booking.customerPhone,
        tripType:        booking.tripType,
        carCategory:     booking.carCategory,
        carCategoryName: booking.carCategoryName,
        pickupCity:      booking.pickupCity,
        dropCity:        booking.dropCity,
        pickupDate:      booking.pickupDate,
        pickupTime:      booking.pickupTime,
        returnDate:      booking.returnDate,
        totalDays:       booking.totalDays,
        pickupAddress:   booking.pickupAddress,
        dropAddress:     booking.dropAddress,
        intermediateStops,
        baseFare:        booking.baseFare,
        perKmRate:       booking.perKmRate,
        chargeableKm:    booking.chargeableKm,
        kmCharges:       booking.kmCharges,
        driverBatta:     booking.driverBatta,
        nightCharges:       booking.nightCharges,
        tollCharges:        booking.tollCharges,
        statePermitCharges: booking.statePermitCharges,
        gstAmount:       booking.gstAmount,
        platformFee:     booking.platformFee,
        grandTotal:      booking.grandTotal,
        partialPayment:  booking.partialPayment,
        paidAmount:      booking.paidAmount,
        paymentStatus:   booking.paymentStatus,
        paymentMethod:   booking.paymentMethod,
        transactionId:   booking.transactionId,
        status:          booking.status,
        acceptedDriverId:  booking.acceptedDriverId,
        acceptedStaffId:   booking.acceptedStaffId,
        acceptedVendorId:  booking.acceptedVendorId,
        driverName:        resolvedDriverName,
        driverPhone:       resolvedDriverPhone,
        driverPhoto:       resolvedDriverPhoto,
        vehicleNumber:   booking.vehicleNumber,
        vehicleModel:    booking.vehicleModel,
        tripStartOtp:    booking.tripStartOtp,
        customerNotes:   booking.customerNotes,
        vendorNotes:     booking.vendorNotes,
        localPackageId:   booking.localPackageId,
        localPackageHours: booking.localPackageHours,
        localPackageKm:   booking.localPackageKm,
        cancelledAt:     booking.cancelledAt,
        cancellationReason: booking.cancellationReason,
        rating:          booking.rating,
        review:          booking.review,
        location:        booking.locations,
        vendor: (acceptedVendor && !booking.acceptedDriverId && !booking.acceptedStaffId) ? {
          id: acceptedVendor.id,
          businessName: acceptedVendor.businessName,
          ownerName: acceptedVendor.ownerName,
          phone: acceptedVendor.phone,
          logo: acceptedVendor.logo,
          city: acceptedVendor.city,
          rating: acceptedVendor.rating,
        } : null,
        source:          booking.source,
        bookingMode:     booking.bookingMode,
        createdAt:       booking.createdAt,
        updatedAt:       booking.updatedAt,
        refund: refundFollowup && {
          status: refundFollowup.status,
          // Null until a manager has actually reviewed it — the page must
          // not show the original owed amount as if it were decided.
          decidedAmount:
            refundFollowup.customerRefundApproved === null
              ? null
              : refundFollowup.customerRefundApproved
                ? (refundFollowup.approvedAmount ?? refundFollowup.amount)
                : 0,
          customerRefundApproved: refundFollowup.customerRefundApproved,
        },
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch car rental booking', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch booking', details: error?.message }, { status: 500 });
  }
}

// PATCH - Cancel or rate
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingNumber: string }> | { bookingNumber: string } }
) {
  try {
    const resolvedParams = 'then' in params ? await params : params;
    const { bookingNumber } = resolvedParams;
    const body = await request.json();
    const { action } = body;

    const booking = await prisma.chauffeur_bookings.findFirst({
      where: { OR: [{ id: bookingNumber }, { bookingNumber }] },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    switch (action) {
      case 'cancel': {
        // Up to driver assignment, matching the web page's Cancel button; once
        // the trip is under way it can no longer be cancelled here.
        const cancellable = ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'DRIVER_ASSIGNED'];
        if (!cancellable.includes(booking.status)) {
          return NextResponse.json({ success: false, error: 'Booking cannot be cancelled at this stage' }, { status: 400 });
        }
        const reason: string | undefined = body.cancellationReason || body.reason;

        // Same shape as the other services: the closer to pickup, the less comes back.
        let refundAmount = 0;
        let refundPolicyNote: string | null = null;
        if (booking.paidAmount > 0) {
          const hoursUntilPickup = (new Date(booking.pickupDate).getTime() - Date.now()) / (1000 * 60 * 60);
          if (hoursUntilPickup > 24) {
            refundAmount = booking.paidAmount * 0.9;
            refundPolicyNote = '90% refund — cancelled more than 24h before pickup.';
          } else if (hoursUntilPickup > 6) {
            refundAmount = booking.paidAmount * 0.5;
            refundPolicyNote = '50% refund — cancelled 6–24h before pickup.';
          } else {
            refundPolicyNote = 'no refund — cancelled within 6h of pickup.';
          }
        }

        const updated = await prisma.chauffeur_bookings.update({
          where: { id: booking.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: new Date(),
            cancelledBy: 'CUSTOMER',
            cancellationReason: reason || 'Customer cancelled',
            refundAmount,
          },
        });

        // Non-blocking: the vendor has a car and driver held for this trip.
        const cancelledVendorId = booking.assignedVendorId || booking.acceptedVendorId;
        if (cancelledVendorId) {
          sendVendorDirectNotification({
            vendorId: cancelledVendorId,
            title: 'Booking cancelled by customer',
            body: `Booking #${booking.bookingNumber} was cancelled. Reason: ${reason || 'not given'}.`,
            type: 'booking_cancelled',
            serviceType: 'chauffeur',
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
          }).catch((err: unknown) => console.error('[Cancel] vendor notification failed:', err));
        }

        // Money owed goes on the refunds queue and the desk is told. Never
        // blocks the cancellation.
        openRefundFollowup({
          source: 'chauffeur_bookings',
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
          serviceType: 'Car Rental',
          customerId: booking.customerId,
          customerName: booking.customerName,
          amount: refundAmount,
          policyNote: refundPolicyNote,
          reason,
          paidAmount: booking.paidAmount || 0,
        }).catch(() => {});

        return NextResponse.json({
          success: true,
          message: 'Booking cancelled successfully',
          booking: { id: updated.id, bookingNumber: updated.bookingNumber, status: updated.status, refundAmount },
        });
      }
      case 'review':
      case 'rate': {
        if (booking.status !== 'COMPLETED') {
          return NextResponse.json({ success: false, error: 'Only completed bookings can be rated' }, { status: 400 });
        }
        if (booking.rating) {
          return NextResponse.json({ success: false, error: 'You have already rated this trip' }, { status: 400 });
        }
        const { rating, review, driverRating } = body;
        const stars = parseStarRating(rating);
        if (!stars) {
          return NextResponse.json({ success: false, error: 'Rating must be 1-5' }, { status: 400 });
        }
        // Only an unrated row is written, so a double submit cannot count twice.
        const { count } = await prisma.chauffeur_bookings.updateMany({
          where: { id: booking.id, rating: null },
          data: { rating: stars, review: review || null, driverRating: parseStarRating(driverRating) ?? stars },
        });
        if (!count) {
          return NextResponse.json({ success: false, error: 'You have already rated this trip' }, { status: 400 });
        }
        updateVendorRating(booking.acceptedVendorId, stars).catch(() => {});
        return NextResponse.json({ success: true, message: 'Thank you for your feedback!', booking: { id: booking.id, rating: stars } });
      }
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    logger.error('Failed to update car rental booking', error);
    return NextResponse.json({ success: false, error: 'Failed to update booking', details: error?.message }, { status: 500 });
  }
}
