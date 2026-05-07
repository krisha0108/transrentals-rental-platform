// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get a specific truck quote request details for vendor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const { id } = await params;

    // Fetch the quote request
    const quoteRequest = await prisma.truck_quote_requests.findUnique({
      where: { id },
      include: {
        locations: {
          select: { name: true, slug: true },
        },
        truck_quotes: {
          where: { vendorId: vendorId },
          select: {
            id: true,
            quoteNumber: true,
            totalAmount: true,
            status: true,
          },
        },
      },
    });

    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    // Check if vendor already has a quote for this request
    const hasQuoted = quoteRequest.truck_quotes.length > 0;

    // If request is accepted, find the booking created from this request
    const booking = await prisma.truck_bookings.findFirst({
      where: { quoteRequestId: id },
      select: { id: true },
    });

    // Use location from relation if available, fallback to city fields
    const pickupCityName = quoteRequest.locations?.name || quoteRequest.pickupCity || 'N/A';
    const dropCityName = quoteRequest.dropCity || 'N/A';

    return NextResponse.json({
      success: true,
      bookingId: booking?.id || null,
      request: {
        id: quoteRequest.id,
        requestNumber: quoteRequest.requestNumber,
        customerName: quoteRequest.customerName,
        customerPhone: quoteRequest.customerPhone,
        customerEmail: quoteRequest.customerEmail,
        serviceType: quoteRequest.serviceType,
        vehicleCategory: quoteRequest.vehicleCategory,
        vehicleCategoryName: quoteRequest.vehicleCategoryName,
        truckBodyType: quoteRequest.truckBodyType,
        tripDirection: quoteRequest.tripDirection,
        goodsType: quoteRequest.goodsType,
        goodsDescription: quoteRequest.goodsDescription,
        estimatedWeight: quoteRequest.estimatedWeight,
        estimatedVolume: quoteRequest.estimatedVolume,
        pickupCity: pickupCityName,
        pickupAddress: quoteRequest.pickupAddress,
        pickupPincode: quoteRequest.pickupPincode,
        pickupFloor: quoteRequest.pickupFloor,
        hasPickupLift: quoteRequest.hasPickupLift,
        dropCity: dropCityName,
        dropAddress: quoteRequest.dropAddress,
        dropPincode: quoteRequest.dropPincode,
        dropFloor: quoteRequest.dropFloor,
        hasDropLift: quoteRequest.hasDropLift,
        pickupDate: quoteRequest.pickupDate,
        pickupTime: quoteRequest.pickupTime,
        expectedDeliveryDate: quoteRequest.expectedDeliveryDate,
        expectedDeliveryTime: quoteRequest.expectedDeliveryTime,
        isFlexibleDate: quoteRequest.isFlexibleDate,
        requiresLabour: quoteRequest.requiresLabour,
        labourCount: quoteRequest.labourCount,
        hasMultipleStops: quoteRequest.hasMultipleStops,
        multipleStopsDetails: quoteRequest.multipleStopsDetails,
        receiverName: quoteRequest.receiverName,
        receiverPhone: quoteRequest.receiverPhone,
        requiresPOD: quoteRequest.requiresPOD,
        requirements: quoteRequest.requirements,
        needInsurance: quoteRequest.needInsurance,
        needPackaging: quoteRequest.needPackaging,
        budgetMin: quoteRequest.budgetMin,
        budgetMax: quoteRequest.budgetMax,
        status: quoteRequest.status,
        totalQuotesReceived: quoteRequest.totalQuotesReceived,
        quotesOpenTill: quoteRequest.quotesOpenTill,
        expiresAt: quoteRequest.expiresAt,
        createdAt: quoteRequest.createdAt,
        location: quoteRequest.locations,
      },
      hasQuoted,
      vendorQuote: hasQuoted ? quoteRequest.truck_quotes[0] : null,
    });
  } catch (error: any) {
    logger.error('Failed to fetch truck quote request details', error);
    return NextResponse.json(
      { error: 'Failed to fetch request', details: error?.message },
      { status: 500 }
    );
  }
}
