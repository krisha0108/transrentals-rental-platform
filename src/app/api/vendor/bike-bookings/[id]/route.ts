import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Fetch a single bike booking for vendor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Get vendor
    const vendor = await prisma.vendors.findFirst({
      where: { id: auth.vendorId },
      select: {
        id: true,
        vendor_approved_locations: { select: { locationId: true } },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const approvedLocationIds = vendor.vendor_approved_locations.map((l) => l.locationId);

    // Fetch booking - support both ID and booking number
    const booking = await prisma.bike_bookings.findFirst({
      where: {
        OR: [
          { id },
          { bookingNumber: id },
        ],
      },
      include: {
        locations: { select: { id: true, name: true, slug: true } },
        vendors_bike_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true } },
        customers: { select: { id: true, name: true, email: true, phone: true } },
        bike_quote_requests: { select: { pickupAddress: true, numberOfVehicles: true } },
        // Accepted quote → full terms (inclusions/exclusions/km/helmets/etc.)
        bike_quotes: {
          select: {
            quoteNumber: true, vehicleName: true, vehicleBrand: true, vehicleCategory: true,
            dailyRate: true, securityDeposit: true, grandTotal: true,
            advancePercent: true, advanceAmount: true,
            helmetsIncluded: true, kmLimitPerDay: true, extraKmCharge: true,
            inclusions: true, exclusions: true, termsConditions: true, vendorMessage: true,
            validTill: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if vendor is authorized to view this booking
    const notifiedVendors = (booking.notifiedVendorIds as string[] | null) || [];
    const isAssigned = booking.assignedVendorId === vendor.id;
    const isAccepted = booking.acceptedVendorId === vendor.id;
    const isNotified = notifiedVendors.includes(vendor.id);
    const hasApprovedLocation = approvedLocationIds.includes(booking.locationId);

    // Statuses that allow vendor viewing with approved location
    const viewableStatuses = ['PENDING_PAYMENT', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'CONFIRMED', 'READY_FOR_PICKUP', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'REFUNDED'];

    // Vendor can view if:
    // 1. They are the assigned vendor
    // 2. They accepted the booking
    // 3. They were notified about the booking (in notifiedVendorIds)
    // 4. They have approved location and booking is in a viewable status
    // Exception: PAYMENT_VERIFIED with assignedVendorId set — only the assigned vendor can view (quote-based booking)
    const isQuoteBasedPayment = booking.status === 'PAYMENT_VERIFIED' && booking.assignedVendorId !== null;
    const canView = isAssigned || isAccepted || isNotified ||
      (hasApprovedLocation && viewableStatuses.includes(booking.status) && !isQuoteBasedPayment);

    if (!canView) {
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
        customerId: booking.customerId,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        requestedVehicleName: booking.requestedVehicleName,
        requestedBrand: booking.requestedBrand,
        requestedCategory: booking.requestedCategory,
        requestedModelId: booking.requestedModelId,
        locationId: booking.locationId,
        locationName: booking.locationName,
        location: booking.locations,
        pickupDate: booking.pickupDate.toISOString(),
        pickupTime: booking.pickupTime,
        dropDate: booking.dropDate.toISOString(),
        dropTime: booking.dropTime,
        totalDays: booking.totalDays,
        numberOfVehicles: booking.bike_quote_requests?.numberOfVehicles || null,
        pickupAddress: booking.bike_quote_requests?.pickupAddress || null,
        dailyRate: booking.dailyRate,
        totalAmount: booking.totalAmount,
        gstAmount: booking.gstAmount,
        securityDeposit: booking.securityDeposit,
        grandTotal: booking.grandTotal,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        customerNotes: booking.customerNotes,
        acceptedVehicleName: booking.acceptedVehicleName,
        acceptedVendor: booking.vendors_bike_bookings_acceptedVendorIdTovendors,
        acceptedAt: booking.acceptedAt?.toISOString(),
        createdAt: booking.createdAt.toISOString(),
        updatedAt: booking.updatedAt.toISOString(),
        droppedAt: booking.droppedAt?.toISOString(),
        dropReason: booking.dropReason,
        cancellationReason: booking.cancellationReason,
        cancelledAt: null, // bike_bookings schema does not have cancelledAt
        // Additional flags for UI
        // PAYMENT_VERIFIED: only the assigned vendor can accept (quote-based booking)
        // BROADCASTED / PENDING_VENDOR: any vendor with approved location or notification can accept
        canAccept: (
          (['PENDING_VENDOR', 'BROADCASTED'].includes(booking.status) &&
            (isAssigned || isNotified || hasApprovedLocation)) ||
          (booking.status === 'PAYMENT_VERIFIED' && isAssigned)
        ),
        isOwnBooking: isAssigned || isAccepted,
        // Full accepted-quote terms for the "Quote Details" section
        quote: booking.bike_quotes ? {
          quoteNumber:     booking.bike_quotes.quoteNumber,
          vehicleName:     booking.bike_quotes.vehicleName,
          vehicleBrand:    booking.bike_quotes.vehicleBrand,
          vehicleCategory: booking.bike_quotes.vehicleCategory,
          dailyRate:       booking.bike_quotes.dailyRate,
          securityDeposit: booking.bike_quotes.securityDeposit,
          grandTotal:      booking.bike_quotes.grandTotal,
          advancePercent:  booking.bike_quotes.advancePercent,
          advanceAmount:   booking.bike_quotes.advanceAmount,
          helmetsIncluded: booking.bike_quotes.helmetsIncluded,
          kmLimitPerDay:   booking.bike_quotes.kmLimitPerDay,
          unlimitedKm:     booking.bike_quotes.kmLimitPerDay === 0 || booking.bike_quotes.kmLimitPerDay === null,
          extraKmCharge:   booking.bike_quotes.extraKmCharge,
          inclusions:      booking.bike_quotes.inclusions,
          exclusions:      booking.bike_quotes.exclusions,
          termsConditions: booking.bike_quotes.termsConditions,
          vendorMessage:   booking.bike_quotes.vendorMessage,
          validTill:       booking.bike_quotes.validTill?.toISOString() || null,
        } : null,
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
