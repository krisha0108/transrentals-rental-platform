import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Fetch single booking for vendor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get vendor
    const vendor = await prisma.vendors.findFirst({
      where: { id: auth.vendorId },
      select: { id: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Get booking
    const booking = await prisma.car_bookings.findUnique({
      where: { id },
      include: {
        locations: { select: { name: true, slug: true } },
        self_drive_quote_requests: { select: { numberOfVehicles: true } },
        // Accepted quote → full terms (inclusions/exclusions/km/etc.)
        self_drive_quotes: {
          select: {
            quoteNumber: true, vehicleName: true, vehicleCategory: true,
            dailyRate: true, securityDeposit: true, grandTotal: true,
            advancePercent: true, advanceAmount: true, kmLimitPerDay: true,
            inclusions: true, exclusions: true, termsConditions: true,
            vendorMessage: true, validTill: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if this booking is relevant to this vendor
    // Allow viewing if:
    // 1. Vendor is assigned or accepted
    // 2. Booking is in a viewable status
    // 3. Vendor is in notifiedVendorIds
    const isAssigned = booking.assignedVendorId === vendor.id;
    const isAccepted = booking.acceptedVendorId === vendor.id;
    const isNotified = Array.isArray(booking.notifiedVendorIds) &&
      (booking.notifiedVendorIds as string[]).includes(vendor.id);

    const viewableStatuses = ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'CONFIRMED', 'READY_FOR_PICKUP', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'REFUNDED'];
    const isViewableStatus = viewableStatuses.includes(booking.status);

    if (!isAssigned && !isAccepted && !isNotified && !isViewableStatus) {
      return NextResponse.json(
        { error: 'You are not authorized to view this booking' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        isOwnBooking: isAssigned || isAccepted,
        customerId: booking.customerId,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        requestedVehicleId: booking.requestedVehicleId,
        requestedVehicleName: booking.requestedVehicleName,
        requestedBrand: booking.requestedBrand,
        requestedCategory: booking.requestedCategory,
        requestedTransmission: booking.requestedTransmission,
        requestedFuelType: booking.requestedFuelType,
        requestedSeats: booking.requestedSeats,
        numberOfVehicles: (booking as any).self_drive_quote_requests?.numberOfVehicles ?? null,
        locationId: booking.locationId,
        locationName: booking.locationName,
        pickupAddress: booking.pickupAddress,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        dropDate: booking.dropDate,
        dropTime: booking.dropTime,
        totalDays: booking.totalDays,
        dailyRate: booking.dailyRate,
        baseAmount: booking.baseAmount,
        gstAmount: booking.gstAmount,
        platformFee: booking.platformFee,
        securityDeposit: booking.securityDeposit,
        grandTotal: booking.grandTotal,
        advanceAmount: booking.advanceAmount,
        advancePercentage: booking.advancePercentage,
        kmLimitPerDay: booking.kmLimitPerDay,
        extraKmRate: booking.extraKmRate,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        responseDeadline: booking.responseDeadline,
        createdAt: booking.createdAt,
        droppedAt: booking.droppedAt,
        dropReason: booking.dropReason,
        acceptedAt: booking.acceptedAt,
        pickedUpAt: booking.pickedUpAt,
        returnedAt: booking.returnedAt,
        customerNotes: booking.customerNotes,
        tripStartOtp: booking.tripStartOtp,
        odometerStart: booking.odometerStart,
        odometerEnd: booking.odometerEnd,
        cancelledAt: booking.cancelledAt,
        cancelledBy: booking.cancelledBy,
        cancellationReason: booking.cancellationReason,
        refundAmount: booking.refundAmount,
        paidAmount: booking.paidAmount,
        // Full accepted-quote terms for the "Quote Details" section
        quote: (booking as any).self_drive_quotes ? {
          quoteNumber:     (booking as any).self_drive_quotes.quoteNumber,
          vehicleName:     (booking as any).self_drive_quotes.vehicleName,
          vehicleCategory: (booking as any).self_drive_quotes.vehicleCategory,
          dailyRate:       (booking as any).self_drive_quotes.dailyRate,
          securityDeposit: (booking as any).self_drive_quotes.securityDeposit,
          grandTotal:      (booking as any).self_drive_quotes.grandTotal,
          advancePercent:  (booking as any).self_drive_quotes.advancePercent,
          advanceAmount:   (booking as any).self_drive_quotes.advanceAmount,
          kmLimitPerDay:   (booking as any).self_drive_quotes.kmLimitPerDay,
          unlimitedKm:     (booking as any).self_drive_quotes.kmLimitPerDay === 0 || (booking as any).self_drive_quotes.kmLimitPerDay === null,
          inclusions:      (booking as any).self_drive_quotes.inclusions,
          exclusions:      (booking as any).self_drive_quotes.exclusions,
          termsConditions: (booking as any).self_drive_quotes.termsConditions,
          vendorMessage:   (booking as any).self_drive_quotes.vendorMessage,
          validTill:       (booking as any).self_drive_quotes.validTill?.toISOString() || null,
        } : null,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching booking', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking', details: error?.message },
      { status: 500 }
    );
  }
}
