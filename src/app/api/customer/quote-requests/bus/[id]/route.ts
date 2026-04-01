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

    // Transform quotes for frontend
    const quotes = (quoteRequest.bus_quotes_bus_quotes_requestIdTobus_quote_requests || []).map((quote) => ({
      id: quote.id,
      vendorId: quote.vendorId,
      vendorName: quote.vendors?.businessName || 'Vendor',
      vendorRating: quote.vendors?.rating || 0,
      vendorTotalTrips: 0,
      busCategory: quote.vehicle_category, // Frontend expects busCategory
      vehicleName: quote.vehicleName,
      vehicleNumber: quote.vehicleNumber,
      seats: quote.seats,
      totalAmount: quote.totalAmount,
      baseRate: quote.baseAmount, // Frontend expects baseRate
      driverAllowance: quote.driverAllowance || 0,
      tollCharges: quote.tollEstimate || 0, // Frontend expects tollCharges
      parkingCharges: quote.parkingEstimate || 0, // Frontend expects parkingCharges
      inclusions: quote.inclusions || [],
      exclusions: quote.exclusions || [],
      termsConditions: quote.termsConditions || [],
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
      requirements: quoteRequest.requirements || '',
      status: quoteRequest.status,
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
