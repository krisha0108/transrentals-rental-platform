import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Fetch a single car booking by ID or booking number
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idOrNumber = params.id;

    // Try to find by booking number first, then by ID
    const booking = await prisma.car_bookings.findFirst({
      where: {
        OR: [
          { bookingNumber: idOrNumber },
          { id: idOrNumber },
        ],
      },
      include: {
        locations: { select: { name: true, slug: true } },
        vendors_car_bookings_acceptedVendorIdTovendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            rating: true,
          },
        },
        self_drive_quote_requests: {
          select: {
            requestNumber: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
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
        location: booking.locations,
        locationName: booking.locationName,
        requestedVehicleName: booking.requestedVehicleName,
        requestedBrand: booking.requestedBrand,
        requestedCategory: booking.requestedCategory,
        requestedVehicleType: booking.requestedVehicleType,
        requestedTransmission: booking.requestedTransmission,
        requestedFuelType: booking.requestedFuelType,
        requestedSeats: booking.requestedSeats,
        assignedVehicleName: booking.assignedVehicleName,
        pickupAddress: booking.pickupAddress,
        dropAddress: booking.dropAddress,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        dropDate: booking.dropDate,
        dropTime: booking.dropTime,
        totalDays: booking.totalDays,
        isDeliveryRequested: booking.isDeliveryRequested,
        dailyRate: booking.dailyRate,
        baseAmount: booking.baseAmount,
        gstAmount: booking.gstAmount,
        platformFee: booking.platformFee,
        securityDeposit: booking.securityDeposit,
        grandTotal: booking.grandTotal,
        kmLimitPerDay: booking.kmLimitPerDay,
        extraKmRate: booking.extraKmRate,
        odometerStart: booking.odometerStart,
        odometerEnd: booking.odometerEnd,
        extraKmCharges: booking.extraKmCharges,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paidAmount: booking.paidAmount,
        paymentMethod: booking.paymentMethod,
        transactionId: booking.transactionId,
        withFuelIncluded: booking.withFuelIncluded,
        fuelLevel: booking.fuelLevel,
        returnFuelLevel: booking.returnFuelLevel,
        addons: booking.addons,
        licenseNumber: booking.licenseNumber,
        licenseVerified: booking.licenseVerified,
        customerNotes: booking.customerNotes,
        vendorNotes: booking.vendorNotes,
        tripStartOtp: booking.tripStartOtp,
        tripOtpVerified: booking.tripOtpVerified,
        tripOtpVerifiedAt: booking.tripOtpVerifiedAt,
        acceptedAt: booking.acceptedAt,
        pickedUpAt: booking.pickedUpAt,
        returnedAt: booking.returnedAt,
        completedAt: booking.completedAt,
        rating: booking.rating,
        review: booking.review,
        cancelledAt: booking.cancelledAt,
        cancelledBy: booking.cancelledBy,
        cancellationReason: booking.cancellationReason,
        refundAmount: booking.refundAmount,
        vendor: booking.vendors_car_bookings_acceptedVendorIdTovendors,
        quoteRequest: booking.self_drive_quote_requests,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch car booking', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking', details: error?.message },
      { status: 500 }
    );
  }
}
