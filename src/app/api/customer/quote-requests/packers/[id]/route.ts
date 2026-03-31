// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const quoteRequest = await prisma.packers_quote_requests.findUnique({
      where: { id },
      include: {
        packers_quotes: {
          where: {
            status: { in: ['SENT', 'VIEWED', 'ACCEPTED', 'EXPIRED'] },
          },
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                rating: true,
                totalRatings: true,
              },
            },
          },
          orderBy: { totalAmount: 'asc' },
        },
        customers: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!quoteRequest) {
      return NextResponse.json(
        { success: false, message: 'Quote request not found' },
        { status: 404 }
      );
    }

    // Mark quotes as viewed
    const unviewedQuoteIds = quoteRequest.packers_quotes
      .filter((q) => !q.viewedAt)
      .map((q) => q.id);

    if (unviewedQuoteIds.length > 0) {
      await prisma.packers_quotes.updateMany({
        where: { id: { in: unviewedQuoteIds } },
        data: {
          viewedAt: new Date(),
          viewCount: { increment: 1 },
          status: 'VIEWED',
        },
      });
    }

    // Helper to parse JSON string to array
    const parseJsonArray = (value: any): string[] => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    // Transform quotes for frontend
    const quotes = quoteRequest.packers_quotes.map((quote) => ({
      id: quote.id,
      vendorId: quote.vendorId,
      vendorName: quote.vendors?.businessName || 'Verified Vendor',
      vendorRating: quote.vendors?.rating || 0,
      vendorTotalTrips: quote.vendors?.totalRatings || 0,
      totalAmount: quote.totalAmount,
      advanceAmount: quote.advanceAmount || 0,
      advancePercent: quote.advancePercent || 0,
      packingCharges: quote.packingCharges || 0,
      loadingCharges: quote.loadingCharges || 0,
      transportCharges: quote.transportCharges || 0,
      unloadingCharges: quote.unloadingCharges || 0,
      unpackingCharges: quote.unpackingCharges || 0,
      storageCharges: quote.storageCharges || 0,
      insuranceCharges: quote.insuranceCharges || 0,
      materialCharges: quote.materialCharges || 0,
      gstAmount: quote.gstAmount || 0,
      laborCharges: (quote.loadingCharges || 0) + (quote.unloadingCharges || 0),
      vehicleType: quote.vehicleType,
      teamSize: quote.teamSize,
      estimatedDays: parseInt(quote.estimatedDuration?.replace(/\D/g, '') || '1'),
      inclusions: parseJsonArray(quote.inclusions),
      exclusions: parseJsonArray(quote.exclusions),
      termsConditions: parseJsonArray(quote.termsConditions),
      notes: '',
      validUntil: quote.validTill,
      status: quote.status,
      createdAt: quote.createdAt,
    }));

    // Transform request for frontend
    const transformedRequest = {
      id: quoteRequest.id,
      requestNumber: quoteRequest.requestNumber,
      serviceType: quoteRequest.serviceType,
      shiftingType: quoteRequest.shiftingType,
      propertySize: quoteRequest.propertySize,
      pickupCity: quoteRequest.pickupCity,
      pickupAddress: quoteRequest.pickupAddress,
      dropCity: quoteRequest.dropCity,
      dropAddress: quoteRequest.dropAddress,
      preferredDate: quoteRequest.preferredDate,
      needPacking: quoteRequest.needPacking,
      needUnpacking: quoteRequest.needUnpacking,
      requirements: quoteRequest.requirements,
      status: quoteRequest.status,
    };

    return NextResponse.json({
      success: true,
      request: transformedRequest,
      quotes,
    });
  } catch (error: any) {
    logger.error('Error fetching packers quote request', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch quote request', error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
