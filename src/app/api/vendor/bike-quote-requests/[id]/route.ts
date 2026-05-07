// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get a specific bike quote request details for vendor
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
    const quoteRequest = await prisma.bike_quote_requests.findUnique({
      where: { id },
      include: {
        bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
          where: { vendorId: vendorId },
          select: {
            id: true,
            quoteNumber: true,
            grandTotal: true,
            status: true,
          },
        },
        locations: { select: { name: true, slug: true } },
      },
    });

    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    // Check if vendor already has a quote for this request
    const hasQuoted = quoteRequest.bike_quotes_bike_quotes_requestIdTobike_quote_requests.length > 0;

    // If request is accepted, find the booking created from this request
    const booking = await prisma.bike_bookings.findFirst({
      where: { quoteRequestId: id },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      bookingId: booking?.id || null,
      request: {
        id: quoteRequest.id,
        requestNumber: quoteRequest.requestNumber,
        customerName: quoteRequest.customerName,
        customerPhone: quoteRequest.customerPhone,
        customerEmail: quoteRequest.customerEmail,
        vehicleModelId: quoteRequest.vehicleModelId,
        vehicleModelName: quoteRequest.vehicleModelName,
        vehicleBrand: quoteRequest.vehicleBrand,
        vehicleCategory: quoteRequest.vehicleCategory,
        vehicleCategoryName: quoteRequest.vehicleCategoryName,
        locationId: quoteRequest.locationId,
        locationName: quoteRequest.locationName,
        location: quoteRequest.location,
        pickupDate: quoteRequest.pickupDate,
        pickupTime: quoteRequest.pickupTime,
        dropDate: quoteRequest.dropDate,
        dropTime: quoteRequest.dropTime,
        totalDays: quoteRequest.totalDays,
        helmetsRequired: quoteRequest.helmetsRequired,
        numberOfVehicles: quoteRequest.numberOfVehicles,
        pickupAddress: quoteRequest.pickupAddress,
        customerNotes: quoteRequest.customerNotes,
        budgetMin: quoteRequest.budgetMin,
        budgetMax: quoteRequest.budgetMax,
        status: quoteRequest.status,
        totalQuotesReceived: quoteRequest.totalQuotesReceived,
        quotesOpenTill: quoteRequest.quotesOpenTill,
        expiresAt: quoteRequest.expiresAt,
        createdAt: quoteRequest.createdAt,
      },
      hasQuoted,
      vendorQuote: hasQuoted ? quoteRequest.bike_quotes_bike_quotes_requestIdTobike_quote_requests[0] : null,
    });
  } catch (error: any) {
    logger.error('Failed to fetch bike quote request details', error);
    return NextResponse.json(
      { error: 'Failed to fetch request', details: error?.message },
      { status: 500 }
    );
  }
}
