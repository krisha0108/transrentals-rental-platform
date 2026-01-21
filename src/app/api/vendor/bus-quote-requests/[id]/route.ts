// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get a specific quote request details for vendor
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
    const quoteRequest = await prisma.bus_quote_requests.findUnique({
      where: { id },
      include: {
        locations: {
          select: { name: true, slug: true },
        },
        bus_quotes_bus_quotes_requestIdTobus_quote_requests: {
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
    const hasQuoted = quoteRequest.bus_quotes_bus_quotes_requestIdTobus_quote_requests.length > 0;

    // Use location from relation if available, fallback to city fields
    const pickupCityName = quoteRequest.locations?.name || quoteRequest.pickupCity || 'N/A';
    const dropCityName = quoteRequest.dropCity || 'N/A';

    return NextResponse.json({
      success: true,
      request: {
        id: quoteRequest.id,
        requestNumber: quoteRequest.requestNumber,
        customerName: quoteRequest.customerName,
        customerPhone: quoteRequest.customerPhone,
        customerEmail: quoteRequest.customerEmail,
        tripType: quoteRequest.tripType,
        chauffeur_vehicle_categories: quoteRequest.vehicle_category,
        vehicleCategoryName: quoteRequest.vehicleCategoryName,
        passengers: quoteRequest.passengers,
        pickupCity: pickupCityName,
        pickupAddress: quoteRequest.pickupAddress,
        dropCity: dropCityName,
        dropAddress: quoteRequest.dropAddress,
        routeDetails: quoteRequest.routeDetails,
        stops: quoteRequest.stops,
        pickupDate: quoteRequest.pickupDate,
        pickupTime: quoteRequest.pickupTime,
        returnDate: quoteRequest.returnDate,
        returnTime: quoteRequest.returnTime,
        tripDays: quoteRequest.tripDays,
        requirements: quoteRequest.requirements,
        needAC: quoteRequest.needAC,
        needLuxury: quoteRequest.needLuxury,
        needSleeper: quoteRequest.needSleeper,
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
      vendorQuote: hasQuoted ? quoteRequest.bus_quotes_bus_quotes_requestIdTobus_quote_requests[0] : null,
    });
  } catch (error: any) {
    logger.error('Failed to fetch quote request details', error);
    return NextResponse.json(
      { error: 'Failed to fetch request', details: error?.message },
      { status: 500 }
    );
  }
}
