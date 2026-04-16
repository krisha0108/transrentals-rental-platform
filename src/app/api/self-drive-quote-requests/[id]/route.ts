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
            status: { in: ['SENT', 'VIEWED', 'ACCEPTED', 'EXPIRED'] },
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
        vehicleModelId: quoteRequest.vehicleModelId,
        vehicleModelName: quoteRequest.vehicleModelName,
        vehicleBrand: quoteRequest.vehicleBrand,
        chauffeur_vehicle_categories: quoteRequest.vehicleCategory,
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
      quotes: quoteRequest.self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests.map((q) => {
        // Helper function to extract images from various formats
        const parseImages = (data: any): string[] => {
          if (!data) return [];

          // If it's a string, try to parse it as JSON
          if (typeof data === 'string') {
            try {
              const parsed = data === 'null' ? null : JSON.parse(data);
              if (Array.isArray(parsed)) {
                return parsed.filter(item => item && typeof item === 'string');
              } else if (parsed && typeof parsed === 'object') {
                // Handle object format like {front: "...", back: "...", ...}
                return Object.values(parsed).filter(item => item && typeof item === 'string') as string[];
              }
            } catch {
              // If not valid JSON, try as comma-separated string
              const imgArray = data.split(',').map((s: string) => s.trim()).filter(Boolean);
              if (imgArray.length > 0) return imgArray;
            }
          }

          // If it's already an array
          if (Array.isArray(data)) {
            return data.filter(item => item && typeof item === 'string');
          }

          // If it's already an object
          if (data && typeof data === 'object') {
            return Object.values(data).filter(item => item && typeof item === 'string') as string[];
          }

          return [];
        };

        // First try vehicleImages, then fall back to fleet images
        let vehicleImages = parseImages(q.vehicleImages);
        if (vehicleImages.length === 0 && q.vendor_fleets?.images) {
          vehicleImages = parseImages(q.vendor_fleets.images);
        }

        return {
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
          vehicleImages: vehicleImages ? JSON.stringify(vehicleImages) : null,
          vehicleFeatures: q.vehicleFeatures,
          dailyRate: q.dailyRate,
          totalAmount: q.baseAmount,
          gstAmount: q.gstAmount,
          securityDeposit: q.securityDeposit,
          grandTotal: q.grandTotal,
          advancePercent: q.advancePercent || (q.grandTotal > 0 ? Math.round((q.advanceAmount / q.grandTotal) * 100) : 0),
          advanceAmount: q.advanceAmount,
          kmLimitPerDay: q.kmLimitPerDay,
          unlimitedKm: q.kmLimitPerDay === 0 || q.kmLimitPerDay === null,
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
          vendors: q.vendors,
          createdAt: q.createdAt,
        };
      }),
    });
  } catch (error: any) {
    logger.error('Failed to fetch self-drive quote request', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch request', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Cancel a self-drive quote request (customer)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await params;

    const quoteRequest = await prisma.self_drive_quote_requests.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, customerId: true },
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

    await prisma.self_drive_quote_requests.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true, message: 'Quote request cancelled successfully.' });
  } catch (error: any) {
    logger.error('Failed to cancel self-drive quote request', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel request', details: error?.message },
      { status: 500 }
    );
  }
}
