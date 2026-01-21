// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get individual Self-Drive Quote Request with quotes (for customer)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;

    // Fetch the quote request with all quotes
    const quoteRequest = await prisma.self_drive_quote_requests.findUnique({
      where: { id: requestId },
      include: {
        locations: { select: { id: true, name: true, slug: true } },
        self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: {
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
    const unviewedQuoteIds = quoteRequest.self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests
      .filter((q) => q.status === 'SENT')
      .map((q) => q.id);

    if (unviewedQuoteIds.length > 0) {
      await prisma.self_drive_quotes.updateMany({
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
        licenseNumber: quoteRequest.licenseNumber,
        budgetMin: quoteRequest.budgetMin,
        budgetMax: quoteRequest.budgetMax,
        status: quoteRequest.status,
        totalQuotesReceived: quoteRequest.self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests.length,
        quotesOpenTill: quoteRequest.quotesOpenTill,
        expiresAt: quoteRequest.expiresAt,
        createdAt: quoteRequest.createdAt,
      },
      quotes: quoteRequest.self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests.map((q) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        vendorId: q.vendorId,
        vehicleName: q.vehicleName,
        vehicleBrand: q.vehicleBrand,
        chauffeur_vehicle_categories: q.vehicle_category,
        transmission: q.transmission,
        fuelType: q.fuelType,
        seatingCapacity: q.seats,
        registrationNumber: q.registrationNumber,
        vehicleImages: q.vehicleImages,
        vehicleFeatures: q.vehicleFeatures,
        dailyRate: q.dailyRate,
        totalAmount: q.baseAmount,
        gstAmount: q.gstAmount,
        securityDeposit: q.securityDeposit,
        grandTotal: q.grandTotal,
        advancePercent: q.advancePercent,
        advanceAmount: q.advanceAmount,
        kmLimitPerDay: q.kmLimitPerDay,
        extraKmRate: q.extraKmRate,
        deliveryCharge: q.deliveryCharges,
        inclusions: q.inclusions,
        exclusions: q.exclusions,
        termsConditions: q.termsConditions,
        vendorMessage: q.vendorMessage,
        validTill: q.validTill,
        validityDays: q.validityDays,
        viewCount: q.viewCount,
        status: q.status,
        vendor: q.vendors,
        createdAt: q.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch self-drive quote request', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch request', details: error?.message },
      { status: 500 }
    );
  }
}
