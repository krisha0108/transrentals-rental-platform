// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get a specific packers quote request details for vendor
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const { id } = params;

    // Fetch the quote request
    const quoteRequest = await prisma.packers_quote_requests.findUnique({
      where: { id },
      include: {
        locations: {
          select: { name: true, slug: true },
        },
        packers_quotes: {
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
    const hasQuoted = quoteRequest.packers_quotes.length > 0;

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
        serviceType: quoteRequest.serviceType,
        shiftingType: quoteRequest.shiftingType,
        propertySize: quoteRequest.propertySize,
        inventoryList: quoteRequest.inventoryList,
        hasHeavyItems: quoteRequest.hasHeavyItems,
        heavyItemsDesc: quoteRequest.heavyItemsDesc,
        hasFragileItems: quoteRequest.hasFragileItems,
        fragileItemsDesc: quoteRequest.fragileItemsDesc,
        hasVehicle: quoteRequest.hasVehicle,
        vehicleDetails: quoteRequest.vehicleDetails,
        pickupCity: pickupCityName,
        pickupAddress: quoteRequest.pickupAddress,
        pickupFloor: quoteRequest.pickupFloor,
        hasPickupLift: quoteRequest.hasPickupLift,
        pickupParkingDist: quoteRequest.pickupParkingDist,
        dropCity: dropCityName,
        dropAddress: quoteRequest.dropAddress,
        dropFloor: quoteRequest.dropFloor,
        hasDropLift: quoteRequest.hasDropLift,
        dropParkingDist: quoteRequest.dropParkingDist,
        preferredDate: quoteRequest.preferredDate,
        isFlexibleDate: quoteRequest.isFlexibleDate,
        flexibleDateRange: quoteRequest.flexibleDateRange,
        needPacking: quoteRequest.needPacking,
        needUnpacking: quoteRequest.needUnpacking,
        needStorage: quoteRequest.needStorage,
        storageDays: quoteRequest.storageDays,
        needInsurance: quoteRequest.needInsurance,
        insuranceValue: quoteRequest.insuranceValue,
        requirements: quoteRequest.requirements,
        budgetMin: quoteRequest.budgetMin,
        budgetMax: quoteRequest.budgetMax,
        status: quoteRequest.status,
        totalQuotesReceived: quoteRequest.totalQuotesReceived,
        quotesOpenTill: quoteRequest.quotesOpenTill,
        expiresAt: quoteRequest.expiresAt,
        createdAt: quoteRequest.createdAt,
        location: quoteRequest.location,
        dropLocation: quoteRequest.dropLocation,
      },
      hasQuoted,
      vendorQuote: hasQuoted ? quoteRequest.packers_quotes[0] : null,
    });
  } catch (error: any) {
    logger.error('Failed to fetch packers quote request details', error);
    return NextResponse.json(
      { error: 'Failed to fetch request', details: error?.message },
      { status: 500 }
    );
  }
}
