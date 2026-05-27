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
            status: { in: ['SENT', 'VIEWED', 'ACCEPTED', 'EXPIRED'] },
          },
          select: {
            id: true,
            quoteNumber: true,
            vendorId: true,
            vehicleName: true,
            vehicleBrand: true,
            vehicleCategory: true,
            registrationNumber: true,
            vehicleImages: true,
            vehicleFeatures: true,
            dailyRate: true,
            totalPrice: true,
            totalAmount: true,
            gstAmount: true,
            securityDeposit: true,
            grandTotal: true,
            advancePercent: true,
            advanceAmount: true,
            helmetsIncluded: true,
            kmLimitPerDay: true,
            extraKmCharge: true,
            inclusions: true,
            exclusions: true,
            termsConditions: true,
            vendorMessage: true,
            validTill: true,
            validityDays: true,
            viewCount: true,
            status: true,
            createdAt: true,
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
        vehicleModelId: quoteRequest.vehicleModelId,
        vehicleModelName: quoteRequest.vehicleModelName,
        vehicleBrand: quoteRequest.vehicleBrand,
        vehicleCategory: quoteRequest.vehicleCategory,
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
        numberOfVehicles: quoteRequest.numberOfVehicles,
        pickupAddress: quoteRequest.pickupAddress,
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
        // Resolve images: prefer the linked fleet vehicle's images, else the
        // quote's own stored images. Normalize BOTH to a plain array so the
        // final JSON.stringify never double-encodes an already-stringified value.
        const rawImages = q.vendor_fleets?.images ?? q.vehicleImages;
        let imageArr: string[] = [];
        if (rawImages) {
          let parsed: any = rawImages;
          if (typeof parsed === 'string') {
            try { parsed = parsed === 'null' ? null : JSON.parse(parsed); }
            catch { parsed = null; }
          }
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            imageArr = Object.values(parsed).filter((img): img is string => !!img);   // {front,back} → [...]
          } else if (Array.isArray(parsed)) {
            imageArr = parsed.filter(Boolean);
          }
        }

        return {
          id: q.id,
          quoteNumber: q.quoteNumber,
          vendorId: q.vendorId,
          vehicleName: q.vehicleName,
          vehicleBrand: q.vehicleBrand,
          vehicleCategory: q.vehicleCategory,
          registrationNumber: q.registrationNumber,
          vehicleImages: imageArr.length ? JSON.stringify(imageArr) : null,
          vehicleFeatures: q.vehicleFeatures,
          dailyRate: q.dailyRate,
          totalPrice: q.totalPrice,
          totalAmount: q.totalAmount,
          gstAmount: q.gstAmount,
          securityDeposit: q.securityDeposit,
          grandTotal: q.grandTotal,
          advancePercent: q.advancePercent,
          advanceAmount: q.advanceAmount,
          helmetsIncluded: q.helmetsIncluded,
          kmLimitPerDay: q.kmLimitPerDay,
          unlimitedKm: q.kmLimitPerDay === 0 || q.kmLimitPerDay === null,
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

// PATCH - Cancel a bike quote request (customer)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;

    const quoteRequest = await prisma.bike_quote_requests.findUnique({
      where: { id: requestId },
      select: { id: true, status: true },
    });

    if (!quoteRequest) {
      return NextResponse.json(
        { success: false, error: 'Quote request not found' },
        { status: 404 }
      );
    }

    const cancellableStatuses = ['PENDING', 'QUOTES_RECEIVED'];
    if (!cancellableStatuses.includes(quoteRequest.status)) {
      return NextResponse.json(
        { success: false, error: 'This request cannot be cancelled in its current status.' },
        { status: 400 }
      );
    }

    await prisma.bike_quote_requests.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true, message: 'Quote request cancelled successfully.' });
  } catch (error: any) {
    logger.error('Failed to cancel bike quote request', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel request', details: error?.message },
      { status: 500 }
    );
  }
}
