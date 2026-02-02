// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get individual Bike Quote Request with quotes (for customer)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;

    // Fetch the quote request with all quotes
    const quoteRequest = await prisma.bike_quote_requests.findUnique({
      where: { id: requestId },
      include: {
        locations: { select: { id: true, name: true, slug: true } },
        bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
          where: {
            status: { in: ['SENT', 'VIEWED', 'ACCEPTED'] },
          },
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                rating: true,
                logo: true,
              },
            },
            vendor_fleets: {
              select: {
                id: true,
                images: true,
              },
            },
          },
          orderBy: { grandTotal: 'asc' },
        },
      },
    });

    if (!quoteRequest) {
      return NextResponse.json(
        { success: false, error: 'Quote request not found' },
        { status: 404 }
      );
    }

    // Mark quotes as viewed if they haven't been viewed yet
    const quotes = quoteRequest.bike_quotes_bike_quotes_requestIdTobike_quote_requests || [];
    const unviewedQuoteIds = quotes
      .filter((q) => q.status === 'SENT')
      .map((q) => q.id);

    if (unviewedQuoteIds.length > 0) {
      await prisma.bike_quotes.updateMany({
        where: { id: { in: unviewedQuoteIds } },
        data: {
          status: 'VIEWED',
          viewCount: { increment: 1 },
        },
      });
    }

    return NextResponse.json({
      success: true,
      request: {
        id: quoteRequest.id,
        requestNumber: quoteRequest.requestNumber,
        customerName: quoteRequest.customerName,
        customerPhone: quoteRequest.customerPhone,
        customerEmail: quoteRequest.customerEmail,
        vehicleModelId: quoteRequest.vehicle_modelsId,
        vehicleModelName: quoteRequest.vehicle_modelsName,
        vehicleBrand: quoteRequest.vehicleBrand,
        chauffeur_vehicle_categories: quoteRequest.vehicle_category,
        vehicleCategoryName: quoteRequest.vehicleCategoryName,
        locationId: quoteRequest.locationId,
        locationName: quoteRequest.locationName,
        location: quoteRequest.locations,
        pickupDate: quoteRequest.pickupDate,
        pickupTime: quoteRequest.pickupTime,
        dropDate: quoteRequest.dropDate,
        dropTime: quoteRequest.dropTime,
        totalDays: quoteRequest.totalDays,
        helmetsRequired: quoteRequest.helmetsRequired,
        customerNotes: quoteRequest.customerNotes,
        budgetMin: quoteRequest.budgetMin,
        budgetMax: quoteRequest.budgetMax,
        status: quoteRequest.status,
        totalQuotesReceived: quotes.length,
        quotesOpenTill: quoteRequest.quotesOpenTill,
        expiresAt: quoteRequest.expiresAt,
        createdAt: quoteRequest.createdAt,
      },
      quotes: quotes.map((q) => {
        // Get vehicle images from fleet if available, otherwise use quote's images
        let vehicleImages = q.vehicleImages;
        if (q.vendor_fleets?.images) {
          let fleetImages = typeof q.vendor_fleets.images === 'string'
            ? (q.vendor_fleets.images === 'null' ? null : JSON.parse(q.vendor_fleets.images))
            : q.vendor_fleets.images;

          // Convert object {front: "...", back: "..."} to array ["...", "..."]
          if (fleetImages && typeof fleetImages === 'object' && !Array.isArray(fleetImages)) {
            vehicleImages = Object.values(fleetImages).filter(img => img);
          } else if (Array.isArray(fleetImages)) {
            vehicleImages = fleetImages;
          } else {
            vehicleImages = fleetImages;
          }
        }

        return {
          id: q.id,
          quoteNumber: q.quoteNumber,
          vendorId: q.vendorId,
          vehicleName: q.vehicleName,
          vehicleBrand: q.vehicleBrand,
          chauffeur_vehicle_categories: q.vehicle_category,
          registrationNumber: q.registrationNumber,
          vehicleImages: vehicleImages,
          vehicleFeatures: q.vehicleFeatures,
          dailyRate: q.dailyRate,
          totalAmount: q.totalAmount,
          gstAmount: q.gstAmount,
          securityDeposit: q.securityDeposit,
          grandTotal: q.grandTotal,
          advancePercent: q.advancePercent,
          advanceAmount: q.advanceAmount,
          helmetsIncluded: q.helmetsIncluded,
          kmLimitPerDay: q.kmLimitPerDay,
          extraKmCharge: q.extraKmCharge,
          inclusions: q.inclusions,
          exclusions: q.exclusions,
          termsConditions: q.termsConditions,
          vendorMessage: q.vendorMessage,
          validTill: q.validTill,
          validityDays: q.validityDays,
          viewCount: q.viewCount,
          status: q.status,
          vendors: q.vendors,
          createdAt: q.createdAt,
        };
      }),
    });
  } catch (error: any) {
    logger.error('Failed to fetch bike quote request', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch request', details: error?.message },
      { status: 500 }
    );
  }
}
