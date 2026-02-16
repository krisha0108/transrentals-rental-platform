// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get a specific self-drive quote request details for vendor
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
    const quoteRequest = await prisma.self_drive_quote_requests.findUnique({
      where: { id },
      include: {
        self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: {
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
    const hasQuoted = quoteRequest.self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests.length > 0;

    return NextResponse.json({
      success: true,
      request: {
        id: quoteRequest.id,
        requestNumber: quoteRequest.requestNumber,
        customerName: quoteRequest.customerName,
        customerPhone: quoteRequest.customerPhone,
        customerEmail: quoteRequest.customerEmail,
        vehicleModelId: quoteRequest.vehicleModelId,
        vehicleModelName: quoteRequest.vehicleModelName,
        vehicleBrand: quoteRequest.vehicleBrand,
        chauffeur_vehicle_categories: quoteRequest.vehicle_category,
        vehicleCategoryName: quoteRequest.vehicleCategoryName,
        vehicleType: quoteRequest.vehicleType,
        transmission: quoteRequest.transmission,
        fuelType: quoteRequest.fuelType,
        minSeats: quoteRequest.minSeats,
        locationId: quoteRequest.locationId,
        locationName: quoteRequest.locationName,
        location: quoteRequest.locations,
        pickupAddress: quoteRequest.pickupAddress,
        dropAddress: quoteRequest.dropAddress,
        pickupDate: quoteRequest.pickupDate,
        pickupTime: quoteRequest.pickupTime,
        dropDate: quoteRequest.dropDate,
        dropTime: quoteRequest.dropTime,
        totalDays: quoteRequest.totalDays,
        isDeliveryRequested: quoteRequest.isDeliveryRequested,
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
      vendorQuote: hasQuoted ? quoteRequest.self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests[0] : null,
    });
  } catch (error: any) {
    logger.error('Failed to fetch self-drive quote request details', error);
    return NextResponse.json(
      { error: 'Failed to fetch request', details: error?.message },
      { status: 500 }
    );
  }
}
