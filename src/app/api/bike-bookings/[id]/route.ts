// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
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
        customers: { select: { id: true, name: true, email: true, phone: true } },
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
        acceptedQuote: {
          select: {
            id: true,
            quoteNumber: true,
            vehicleFeatures: true,
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

    // If not found by ID, try by booking number
    if (!booking) {
      booking = await prisma.bike_bookings.findUnique({
        where: { bookingNumber: id },
        include: {
          locations: { select: { id: true, name: true, slug: true } },
          customers: { select: { id: true, name: true, email: true, phone: true } },
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
          acceptedQuote: {
            select: {
              id: true,
              quoteNumber: true,
              vehicleFeatures: true,
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
        quote: booking.acceptedQuote ? {
          id: booking.acceptedQuote.id,
          quoteNumber: booking.acceptedQuote.quoteNumber,
          vehicleFeatures: booking.acceptedQuote.vehicleFeatures,
          registrationNumber: booking.acceptedQuote.registrationNumber,
          helmetsIncluded: booking.acceptedQuote.helmetsIncluded,
          kmLimitPerDay: booking.acceptedQuote.kmLimitPerDay,
          extraKmCharge: booking.acceptedQuote.extraKmCharge,
          inclusions: booking.acceptedQuote.inclusions,
          exclusions: booking.acceptedQuote.exclusions,
          termsConditions: booking.acceptedQuote.termsConditions,
          vendorMessage: booking.acceptedQuote.vendorMessage,
          advancePercent: booking.acceptedQuote.advancePercent,
        } : null,
        responseDeadline: booking.responseDeadline,
        broadcastedAt: booking.broadcastedAt,
        acceptedAt: booking.acceptedAt,
        pickedUpAt: booking.pickedUpAt,
        returnedAt: booking.returnedAt,
        cancellationReason: booking.cancellationReason,
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
    const { action, reason, rating, review } = body;

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

      const updatedBooking = await prisma.bike_bookings.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason || 'Cancelled by customer',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Booking cancelled successfully',
        booking: {
          id: updatedBooking.id,
          bookingNumber: updatedBooking.bookingNumber,
          status: updatedBooking.status,
        },
      });
    }

    if (action === 'rate') {
      if (booking.status !== 'COMPLETED') {
        return NextResponse.json(
          { error: 'Can only rate completed bookings' },
          { status: 400 }
        );
      }

      // Update vendor rating if there's an accepted vendor
      if (booking.acceptedVendorId && rating) {
        // Get current vendor stats
        const vendor = await prisma.vendors.findUnique({
          where: { id: booking.acceptedVendorId },
          select: { rating: true, reviewCount: true },
        });

        if (vendor) {
          const currentRating = vendor.rating || 0;
          const reviewCount = vendor.reviewCount || 0;
          const newRating = ((currentRating * reviewCount) + rating) / (reviewCount + 1);

          await prisma.vendors.update({
            where: { id: booking.acceptedVendorId },
            data: {
              rating: newRating,
              reviewCount: reviewCount + 1,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Rating submitted successfully',
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
        },
      });
    }

    // Customer submits payment proof (screenshot/UTR)
    if (action === 'submit_payment') {
      const { transactionId, paymentMethod, paymentProof } = body;

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
          paymentProof: paymentProof || null,
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
