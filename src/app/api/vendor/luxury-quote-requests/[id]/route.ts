// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get a specific luxury quote request details for vendor
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
    const quoteRequest = await prisma.luxury_quote_requests.findUnique({
      where: { id },
      include: {
        luxury_quotes: {
          where: { vendorId: vendorId },
          select: {
            id: true,
            quoteNumber: true,
            totalAmount: true,
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
    const hasQuoted = quoteRequest.luxury_quotes.length > 0;

    // If request is accepted, find the booking created from this request
    const booking = await prisma.luxury_bookings.findFirst({
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
        tripType: quoteRequest.tripType,
        occasion: quoteRequest.occasion,
        chauffeur_vehicle_categories: quoteRequest.vehicle_category,
        vehicleCategoryName: quoteRequest.vehicleCategoryName,
        passengers: quoteRequest.passengers,
        specificModel: quoteRequest.specificModel,
        pickupCity: quoteRequest.pickupCity,
        pickupAddress: quoteRequest.pickupAddress,
        dropCity: quoteRequest.dropCity,
        dropAddress: quoteRequest.dropAddress,
        routeDetails: quoteRequest.routeDetails,
        pickupDate: quoteRequest.pickupDate,
        pickupTime: quoteRequest.pickupTime,
        returnDate: quoteRequest.returnDate,
        returnTime: quoteRequest.returnTime,
        tripDays: quoteRequest.tripDays,
        tripHours: quoteRequest.tripHours,
        packageType: quoteRequest.packageType,
        requirements: quoteRequest.requirements,
        needChauffeur: quoteRequest.needChauffeur,
        needDecoration: quoteRequest.needDecoration,
        decorationType: quoteRequest.decorationType,
        budgetMin: quoteRequest.budgetMin,
        budgetMax: quoteRequest.budgetMax,
        locationId: quoteRequest.locationId,
        location: quoteRequest.location,
        status: quoteRequest.status,
        totalQuotesReceived: quoteRequest.totalQuotesReceived,
        quotesOpenTill: quoteRequest.quotesOpenTill,
        expiresAt: quoteRequest.expiresAt,
        createdAt: quoteRequest.createdAt,
      },
      hasQuoted,
      vendorQuote: hasQuoted ? quoteRequest.luxury_quotes[0] : null,
    });
  } catch (error: any) {
    logger.error('Failed to fetch luxury quote request details', error);
    return NextResponse.json(
      { error: 'Failed to fetch request', details: error?.message },
      { status: 500 }
    );
  }
}
