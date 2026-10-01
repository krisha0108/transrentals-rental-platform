// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
import { updateVendorRating, parseStarRating } from '@/lib/utils/update-vendor-rating';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
import { openRefundFollowup } from '@/lib/refunds/refund-followup';
export const dynamic = 'force-dynamic';

// GET - Get single booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to find by ID first, then by booking number
    let booking = await prisma.bike_bookings.findUnique({
      where: { id },
      include: {
        locations: { select: { id: true, name: true, slug: true } },
        customers: { select: { id: true, name: true, email: true, phone: true, isB2B: true } },
        vendors_bike_bookings_acceptedVendorIdTovendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            email: true,
            address: true,
            rating: true,
          },
        },
        vendors_bike_bookings_assignedVendorIdTovendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
          },
        },
        bike_quotes: {
          select: {
            id: true,
            quoteNumber: true,
            vehicleFeatures: true,
            vehicleImages: true,
            registrationNumber: true,
            helmetsIncluded: true,
            kmLimitPerDay: true,
            extraKmCharge: true,
            inclusions: true,
            exclusions: true,
            termsConditions: true,
            vendorMessage: true,
            advancePercent: true,
          },
        },
        bike_quote_requests: { select: { pickupAddress: true, numberOfVehicles: true } },
      },
    });

    // If not found by ID, try by booking number
    if (!booking) {
      booking = await prisma.bike_bookings.findUnique({
        where: { bookingNumber: id },
        include: {
          locations: { select: { id: true, name: true, slug: true } },
          customers: { select: { id: true, name: true, email: true, phone: true, isB2B: true } },
          vendors_bike_bookings_acceptedVendorIdTovendors: {
            select: {
              id: true,
              businessName: true,
              phone: true,
              email: true,
              address: true,
              rating: true,
            },
          },
          vendors_bike_bookings_assignedVendorIdTovendors: {
            select: {
              id: true,
              businessName: true,
              phone: true,
            },
          },
          bike_quotes: {
            select: {
              id: true,
              quoteNumber: true,
              vehicleFeatures: true,
              vehicleImages: true,
              registrationNumber: true,
              helmetsIncluded: true,
              kmLimitPerDay: true,
              extraKmCharge: true,
              inclusions: true,
              exclusions: true,
              termsConditions: true,
              vendorMessage: true,
              advancePercent: true,
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
        vehicleBrand: booking.requestedBrand,
        chauffeur_vehicle_categories: booking.requestedCategory,
        assignedVehicle: booking.acceptedVehicleName,
        location: booking.locations,
        locationName: booking.locationName,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        dropDate: booking.dropDate,
        dropTime: booking.dropTime,
        totalDays: booking.totalDays,
        dailyRate: booking.dailyRate,
        totalAmount: booking.totalAmount,
        gstAmount: booking.gstAmount,
        securityDeposit: booking.securityDeposit,
        grandTotal: booking.grandTotal,
        advanceAmount: booking.advanceAmount,
        advancePercentage: booking.advancePercentage,
        helmetsRequired: booking.helmetsRequired,
        numberOfVehicles: booking.bike_quote_requests?.numberOfVehicles || null,
        pickupAddress: booking.bike_quote_requests?.pickupAddress || null,
        addons: booking.addons,
        customerNotes: booking.customerNotes,
        vendorNotes: booking.vendorNotes,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        paidAmount: booking.paidAmount,
        transactionId: booking.transactionId,
        tripStartOtp: booking.tripStartOtp,
        tripOtpVerified: booking.tripOtpVerified,
        vendor: booking.vendors_bike_bookings_acceptedVendorIdTovendors ? {
          id: booking.vendors_bike_bookings_acceptedVendorIdTovendors.id,
          name: booking.vendors_bike_bookings_acceptedVendorIdTovendors.businessName,
          phone: booking.vendors_bike_bookings_acceptedVendorIdTovendors.phone,
          email: booking.vendors_bike_bookings_acceptedVendorIdTovendors.email,
          address: booking.vendors_bike_bookings_acceptedVendorIdTovendors.address,
          rating: booking.vendors_bike_bookings_acceptedVendorIdTovendors.rating,
        } : null,
        assignedVendor: booking.vendors_bike_bookings_assignedVendorIdTovendors ? {
          id: booking.vendors_bike_bookings_assignedVendorIdTovendors.id,
          name: booking.vendors_bike_bookings_assignedVendorIdTovendors.businessName,
          phone: booking.vendors_bike_bookings_assignedVendorIdTovendors.phone,
        } : null,
        // Quote details
        quote: booking.bike_quotes ? {
          id: booking.bike_quotes.id,
          quoteNumber: booking.bike_quotes.quoteNumber,
          vehicleFeatures: booking.bike_quotes.vehicleFeatures,
          vehicleImages: booking.bike_quotes.vehicleImages,
          registrationNumber: booking.bike_quotes.registrationNumber,
          helmetsIncluded: booking.bike_quotes.helmetsIncluded,
          kmLimitPerDay: booking.bike_quotes.kmLimitPerDay,
          extraKmCharge: booking.bike_quotes.extraKmCharge,
          inclusions: booking.bike_quotes.inclusions,
          exclusions: booking.bike_quotes.exclusions,
          termsConditions: booking.bike_quotes.termsConditions,
          vendorMessage: booking.bike_quotes.vendorMessage,
          advancePercent: booking.bike_quotes.advancePercent,
        } : null,
        responseDeadline: booking.responseDeadline,
        broadcastedAt: booking.broadcastedAt,
        acceptedAt: booking.acceptedAt,
        pickedUpAt: booking.pickedUpAt,
        returnedAt: booking.returnedAt,
        cancelledAt: booking.cancelledAt,
        cancelledBy: booking.cancelledBy,
        cancellationReason: booking.cancellationReason,
        rating: booking.rating,
        review: booking.review,
        isB2B: booking.customers?.isB2B || false,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch bike booking', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update booking (e.g., cancel, rate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason, rating, review, driverRating, vehicleRating } = body;

    const booking = await prisma.bike_bookings.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (action === 'cancel') {
      // Check if booking can be cancelled
      const nonCancellableStatuses = ['COMPLETED', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'IN_PROGRESS'];
      if (nonCancellableStatuses.includes(booking.status)) {
        return NextResponse.json(
          { error: 'This booking cannot be cancelled' },
          { status: 400 }
        );
      }

      // Bike was the one service that never worked out what it owed back, so a
      // paid-then-cancelled booking left the customer with nothing recorded.
      // Same shape as the others: the closer to pickup, the less comes back.
      let refundAmount = 0;
      if (booking.paidAmount > 0) {
        const hoursUntilPickup =
          (new Date(booking.pickupDate).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntilPickup > 24) refundAmount = booking.paidAmount * 0.9;
        else if (hoursUntilPickup > 6) refundAmount = booking.paidAmount * 0.5;
      }

      const updatedBooking = await prisma.bike_bookings.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'CUSTOMER',
          cancellationReason: reason || 'Cancelled by customer',
          refundAmount,
        },
      });

      // Non-blocking: the vendor has a slot held for this job.
      const cancelledVendorId = booking.assignedVendorId || booking.acceptedVendorId;
      if (cancelledVendorId) {
        sendVendorDirectNotification({
          vendorId: cancelledVendorId,
          title: 'Booking cancelled by customer',
          body: `Booking #${booking.bookingNumber} was cancelled. Reason: ${reason || 'not given'}.`,
          type: 'booking_cancelled',
          serviceType: 'bike',
          bookingId: booking.id,
          bookingNumber: booking.bookingNumber,
        }).catch((err: unknown) => console.error('[Cancel] vendor notification failed:', err));
      }

      // Money owed goes on the refunds queue and the desk is told. Never
      // blocks the cancellation.
      openRefundFollowup({
        source: 'bike_bookings',
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        serviceType: 'Bike Rental',
        customerId: booking.customerId,
        customerName: booking.customerName,
        amount: refundAmount,
        reason,
        paidAmount: booking.paidAmount || 0,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Booking cancelled successfully',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
          refundAmount: updatedBooking.refundAmount,
        },
      });
    }

    if (action === 'rate' || action === 'review') {
      if (booking.status !== 'COMPLETED') {
        return NextResponse.json(
          { error: 'Can only rate completed bookings' },
          { status: 400 }
        );
      }

      if (booking.rating) {
        return NextResponse.json({ success: false, error: 'You have already rated this trip' }, { status: 400 });
      }
      const stars = parseStarRating(rating);
      if (!stars) {
        return NextResponse.json({ error: 'Valid rating (1-5) is required' }, { status: 400 });
      }

      // Only an unrated row is written, so a double submit cannot count twice.
      const { count } = await prisma.bike_bookings.updateMany({
        where: { id, rating: null },
        data: {
          rating: stars,
          review: review || null,
          driverRating: parseStarRating(driverRating) ?? stars,
          vehicleRating: parseStarRating(vehicleRating) ?? stars,
        },
      });
      if (!count) {
        return NextResponse.json({ success: false, error: 'You have already rated this trip' }, { status: 400 });
      }

      updateVendorRating(booking.acceptedVendorId, stars).catch(() => {});

      return NextResponse.json({
        success: true,
        message: 'Rating submitted successfully',
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          rating: stars,
        },
      });
    }

    // Customer submits payment proof (screenshot/UTR)
    if (action === 'submit_payment') {
      // ✅ FIXED: Use correct field name from database schema
      const { transactionId, paymentMethod, advancePaymentProof, paymentProof } = body;

      if (booking.status !== 'PENDING_PAYMENT') {
        return NextResponse.json(
          { error: 'Payment can only be submitted for pending payment bookings' },
          { status: 400 }
        );
      }

      const updatedBooking = await prisma.bike_bookings.update({
        where: { id },
        data: {
          paymentStatus: 'SUBMITTED',
          status: 'PAYMENT_SUBMITTED',
          transactionId: transactionId || null,
          paymentMethod: paymentMethod || 'UPI',
          // ✅ FIXED: Use correct database field name (backward compatible)
          advancePaymentProof: advancePaymentProof || paymentProof || null,
          advancePaymentDate: new Date(),
          paidAmount: booking.advanceAmount || Math.round((booking.grandTotal || 0) * 0.3),
          paymentSubmittedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Payment proof submitted! Admin will verify shortly.',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          paymentStatus: updatedBooking.paymentStatus,
          status: updatedBooking.status,
        },
      });
    }

    // Admin verifies payment and broadcasts to vendors
    if (action === 'verify_payment') {
      const { isApproved, rejectionReason } = body;

      if (booking.status !== 'PAYMENT_SUBMITTED') {
        return NextResponse.json(
          { error: 'Can only verify submitted payments' },
          { status: 400 }
        );
      }

      if (isApproved) {
        // Payment verified - now broadcast to vendors
        const isBroadcast = !booking.assignedVendorId ||
          (booking.notifiedVendorIds && (booking.notifiedVendorIds as string[]).length > 1);

        const updatedBooking = await prisma.bike_bookings.update({
          where: { id },
          data: {
            paymentStatus: 'VERIFIED',
            status: isBroadcast ? 'BROADCASTED' : 'PENDING_VENDOR',
            paymentVerifiedAt: new Date(),
            broadcastedAt: new Date(),
            responseDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours to respond
          },
        });

        // TODO: Notify vendors via socket/push notification

        return NextResponse.json({
          success: true,
          message: 'Payment verified! Vendors have been notified.',
          booking: {
            id: updatedBooking.id,
            bookingNumber: updatedBooking.bookingNumber,
            paymentStatus: updatedBooking.paymentStatus,
            status: updatedBooking.status,
          },
        });
      } else {
        // Payment rejected
        const updatedBooking = await prisma.bike_bookings.update({
          where: { id },
          data: {
            paymentStatus: 'REJECTED',
            status: 'PENDING_PAYMENT', // Back to pending payment
            paymentRejectionReason: rejectionReason || 'Payment verification failed',
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Payment rejected. Customer has been notified to resubmit.',
          booking: {
            id: updatedBooking.id,
            bookingNumber: updatedBooking.bookingNumber,
            paymentStatus: updatedBooking.paymentStatus,
            status: updatedBooking.status,
          },
        });
      }
    }

    // Legacy: update_payment for admin to manually update payment status
    if (action === 'update_payment') {
      const { paymentStatus, paidAmount, transactionId, paymentMethod } = body;

      const updatedBooking = await prisma.bike_bookings.update({
        where: { id },
        data: {
          paymentStatus: paymentStatus || booking.paymentStatus,
          paidAmount: paidAmount ?? booking.paidAmount,
          transactionId: transactionId || booking.transactionId,
          paymentMethod: paymentMethod || booking.paymentMethod,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Payment updated successfully',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          paymentStatus: updatedBooking.paymentStatus,
          status: updatedBooking.status,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    logger.error('Failed to update bike booking', error);
    return NextResponse.json(
      { error: 'Failed to update booking', details: error?.message },
      { status: 500 }
    );
  }
}
