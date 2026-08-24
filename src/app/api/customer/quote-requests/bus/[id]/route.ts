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

    const quoteRequest = await prisma.bus_quote_requests.findUnique({
      where: { id },
      include: {
        bus_quotes_bus_quotes_requestIdTobus_quote_requests: {
          where: {
            status: { in: ['SENT', 'VIEWED', 'ACCEPTED', 'EXPIRED'] },
          },
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                rating: true,
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

    // inclusions / exclusions / termsConditions are stored as a JSON string.
    // Send them as real arrays — handing the raw string to the client left it
    // splitting on commas, which turned '["A","B"]' into '["A"' + '"B"]' and an
    // empty '[]' into a single literal "[]" item.
    const toList = (raw: any): string[] => {
      if (Array.isArray(raw)) return raw.filter(Boolean);
      if (typeof raw !== 'string' || !raw.trim()) return [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
        if (parsed && typeof parsed === 'object') return Object.values(parsed).filter(Boolean) as string[];
        return [];
      } catch {
        // Not JSON — fall back to the comma-separated form.
        return raw.split(',').map((s) => s.trim()).filter(Boolean);
      }
    };

    // Transform quotes for frontend
    const quotes = (quoteRequest.bus_quotes_bus_quotes_requestIdTobus_quote_requests || []).map((quote) => ({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      vendorId: quote.vendorId,
      vendorName: quote.vendors?.businessName || 'Vendor',
      vendorRating: quote.vendors?.rating || 0,
      vendorTotalTrips: 0,
      busCategory: quote.vehicle_category, // Frontend expects busCategory
      vehicleName: quote.vehicleName,
      vehicleNumber: quote.vehicleNumber,
      seats: quote.seats,
      vehicleImages: quote.vehicleImages,
      totalAmount: quote.totalAmount,
      baseRate: quote.baseAmount, // Frontend expects baseRate
      driverAllowance: quote.driverAllowance || 0,
      nightHaltCharges: quote.nightHaltCharges || 0,
      tollCharges: quote.tollEstimate || 0, // Frontend expects tollCharges
      permitCharges: quote.permitCharges || 0,
      parkingCharges: quote.parkingEstimate || 0, // Frontend expects parkingCharges
      gstAmount: quote.gstAmount || 0,
      advanceAmount: quote.advanceAmount || 0,
      advancePercent: quote.advancePercent || 0,
      isNegotiable: quote.isNegotiable,
      viewCount: quote.viewCount,
      inclusions: toList(quote.inclusions),
      exclusions: toList(quote.exclusions),
      termsConditions: toList(quote.termsConditions),
      notes: quote.vendorMessage, // Frontend expects notes
      validUntil: quote.validTill, // Frontend expects validUntil
      status: quote.status,
      createdAt: quote.createdAt,
    }));

    // Transform request for frontend
    const transformedRequest = {
      id: quoteRequest.id,
      requestNumber: quoteRequest.requestNumber,
      tripType: quoteRequest.tripType,
      busCategory: quoteRequest.vehicle_category, // Frontend expects busCategory
      vehicleCategoryName: quoteRequest.vehicleCategoryName,
      passengerCount: quoteRequest.passengers, // Frontend expects passengerCount
      pickupCity: quoteRequest.pickupCity,
      pickupAddress: quoteRequest.pickupAddress || '',
      dropCity: quoteRequest.dropCity || '',
      dropAddress: quoteRequest.dropAddress || '',
      journeyDate: quoteRequest.pickupDate, // Frontend expects journeyDate
      pickupTime: quoteRequest.pickupTime,
      returnDate: quoteRequest.returnDate,
      returnTime: quoteRequest.returnTime,
      tripDays: quoteRequest.tripDays,
      requirements: quoteRequest.requirements || '',
      needAC: quoteRequest.needAC,
      needLuxury: quoteRequest.needLuxury,
      needSleeper: quoteRequest.needSleeper,
      status: quoteRequest.status,
      totalQuotesReceived: quoteRequest.totalQuotesReceived,
      quotesOpenTill: quoteRequest.quotesOpenTill,
      expiresAt: quoteRequest.expiresAt,
      createdAt: quoteRequest.createdAt,
      customerName: quoteRequest.customerName,
      customerEmail: quoteRequest.customerEmail,
      customerPhone: quoteRequest.customerPhone,
    };

    return NextResponse.json({
      success: true,
      request: transformedRequest,
      quotes,
    });
  } catch (error: any) {
    logger.error('Error fetching bus quote request', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch quote request',
        error: process.env.NODE_ENV === 'development' ? error?.message || String(error) : undefined
      },
      { status: 500 }
    );
  }
}
