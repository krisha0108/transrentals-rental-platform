// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get a specific equipment quote request details for vendor
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
    const quoteRequest = await prisma.equipment_quote_requests.findUnique({
      where: { id },
      include: {
        locations: {
          select: { name: true, slug: true },
        },
        equipment_quotes: {
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
    const hasQuoted = quoteRequest.equipment_quotes.length > 0;

    // If request is accepted, find the booking created from this request
    const booking = await prisma.equipment_bookings.findFirst({
      where: { quoteRequestId: id },
      select: { id: true },
    });

    // Use location from relation if available, fallback to deliveryCity
    const cityName = quoteRequest.locations?.name || quoteRequest.deliveryCity || 'N/A';

    return NextResponse.json({
      success: true,
      bookingId: booking?.id || null,
      request: {
        id: quoteRequest.id,
        requestNumber: quoteRequest.requestNumber,
        customerName: quoteRequest.customerName,
        customerPhone: quoteRequest.customerPhone,
        customerEmail: quoteRequest.customerEmail,
        equipmentCategory: quoteRequest.equipmentCategory,
        equipmentType: quoteRequest.equipmentType,
        specificModel: quoteRequest.equipmentName || quoteRequest.specificModel,
        quantity: quoteRequest.quantity,
        rentalDuration: quoteRequest.rentalDays || quoteRequest.rentalDuration,
        durationUnit: quoteRequest.rentalDuration || quoteRequest.durationUnit,
        city: cityName,
        pickupCity: cityName,
        pickupLocation: cityName,
        locationName: cityName,
        deliveryCity: cityName,
        deliveryAddress: quoteRequest.deliveryAddress,
        startDate: quoteRequest.startDate,
        endDate: quoteRequest.endDate,
        needOperator: quoteRequest.needOperator,
        needDelivery: quoteRequest.needDelivery,
        needInstallation: quoteRequest.needInstallation,
        requirements: quoteRequest.requirements,
        budgetMin: quoteRequest.budgetMin,
        budgetMax: quoteRequest.budgetMax,
        status: quoteRequest.status,
        totalQuotesReceived: quoteRequest.totalQuotesReceived,
        quotesOpenTill: quoteRequest.quotesOpenTill,
        expiresAt: quoteRequest.expiresAt,
        createdAt: quoteRequest.createdAt,
        location: quoteRequest.location,
      },
      hasQuoted,
      vendorQuote: hasQuoted ? quoteRequest.equipment_quotes[0] : null,
    });
  } catch (error: any) {
    logger.error('Failed to fetch equipment quote request details', error);
    return NextResponse.json(
      { error: 'Failed to fetch request', details: error?.message },
      { status: 500 }
    );
  }
}
