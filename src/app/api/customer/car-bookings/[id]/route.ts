// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get single car booking details for customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const session = await getServerSession();

    // For now, allow fetching without strict auth since customer might not be logged in
    // In production, you may want to add phone/email verification

    const booking = await prisma.car_bookings.findFirst({
      where: {
        id: bookingId,
      },
      include: {
        locations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        vendors_car_bookings_assignedVendorIdTovendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            email: true,
            logo: true,
          },
        },
        customers: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            isB2B: true,
          },
        },
        self_drive_quotes: {
          select: {
            id: true,
            termsConditions: true,
            inclusions: true,
            exclusions: true,
            vendorMessage: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        customerId: booking.customerId,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        locationId: booking.locationId,
        locationName: booking.locationName,
        location: booking.locations,
        // Vehicle details
        requestedVehicleId: booking.requestedVehicleId,
        requestedVehicleName: booking.requestedVehicleName,
        requestedBrand: booking.requestedBrand,
        requestedCategory: booking.requestedCategory,
        requestedVehicleType: booking.requestedVehicleType,
        requestedTransmission: booking.requestedTransmission,
        requestedFuelType: booking.requestedFuelType,
        requestedSeats: booking.requestedSeats,
        // Trip details
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        dropDate: booking.dropDate,
        dropTime: booking.dropTime,
        totalDays: booking.totalDays,
        pickupAddress: booking.pickupAddress,
        dropAddress: booking.dropAddress,
        isDeliveryRequested: booking.isDeliveryRequested,
        // Assigned vehicle
        assignedVehicleId: booking.assignedVehicleId,
        assignedVehicleName: booking.assignedVehicleName,
        assignedVendor: booking.vendors_car_bookings_assignedVendorIdTovendors,
        assignedVendorId: booking.assignedVendorId,
        // Pricing
        dailyRate: booking.dailyRate,
        baseAmount: booking.baseAmount,
        gstAmount: booking.gstAmount,
        platformFee: booking.platformFee,
        securityDeposit: booking.securityDeposit,
        grandTotal: booking.grandTotal,
        advanceAmount: booking.advanceAmount,
        advancePercentage: booking.advancePercentage,
        // KM limits
        kmLimitPerDay: booking.kmLimitPerDay,
        extraKmRate: booking.extraKmRate,
        odometerStart: booking.odometerStart,
        odometerEnd: booking.odometerEnd,
        extraKmCharges: booking.extraKmCharges,
        // Status
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paidAmount: booking.paidAmount,
        paymentMethod: booking.paymentMethod,
        transactionId: booking.transactionId,
        paidAmount: booking.paidAmount,
        refundAmount: booking.refundAmount,
        refundTransactionId: booking.refundTransactionId,
        cancelledBy: booking.cancelledBy,
        // Accepted quote T&C
        acceptedQuote: booking.self_drive_quotes
          ? {
              id: booking.self_drive_quotes.id,
              termsConditions: booking.self_drive_quotes.termsConditions,
              inclusions: booking.self_drive_quotes.inclusions,
              exclusions: booking.self_drive_quotes.exclusions,
              vendorMessage: booking.self_drive_quotes.vendorMessage,
            }
          : null,
        // Trip OTP
        tripStartOtp: booking.tripStartOtp,
        tripOtpVerified: booking.tripOtpVerified,
        tripOtpVerifiedAt: booking.tripOtpVerifiedAt,
        // Timestamps
        acceptedAt: booking.acceptedAt,
        pickedUpAt: booking.pickedUpAt,
        returnedAt: booking.returnedAt,
        completedAt: booking.completedAt,
        cancelledAt: booking.cancelledAt,
        cancellationReason: booking.cancellationReason,
        // Notes
        customerNotes: booking.customerNotes,
        vendorNotes: booking.vendorNotes,
        // Rating
        rating: booking.rating,
        review: booking.review,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch car booking details', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking', details: error?.message },
      { status: 500 }
    );
  }
}
