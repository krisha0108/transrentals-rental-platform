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

    const quoteRequest = await prisma.truck_quote_requests.findUnique({
      where: { id },
      include: {
        truck_quotes: {
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
    const quotes = quoteRequest.truck_quotes.map((quote) => ({
      id: quote.id,
      vendorId: quote.vendorId,
      vendorName: quote.vendors?.businessName || 'Vendor',
      vendorRating: quote.vendors?.rating || 0,
      vendorTotalTrips: 0,
      vehicleType: quote.vehicleName,
      vehicleNumber: quote.vehicleNumber,
      totalAmount: quote.totalAmount,
      advanceAmount: quote.advanceAmount || 0,
      advancePercent: quote.advancePercent || 0,
      baseRate: quote.baseAmount || quote.totalAmount,
      loadingCharges: quote.loadingCharges || 0,
      unloadingCharges: quote.unloadingCharges || 0,
      tollCharges: quote.tollEstimate || 0,
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
      chauffeur_vehicle_categories: quoteRequest.vehicleCategoryName || quoteRequest.vehicle_category,
      goodsType: quoteRequest.goodsType,
      estimatedWeight: quoteRequest.estimatedWeight,
      pickupCity: quoteRequest.pickupCity,
      pickupAddress: quoteRequest.pickupAddress,
      dropCity: quoteRequest.dropCity,
      dropAddress: quoteRequest.dropAddress,
      pickupDate: quoteRequest.pickupDate,
      requirements: quoteRequest.requirements,
      status: quoteRequest.status,
    };

    return NextResponse.json({
      success: true,
      request: transformedRequest,
      quotes,
    });
  } catch (error) {
    logger.error('Error fetching truck quote request', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch quote request' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    if (action !== 'cancel') {
      return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

    const quoteRequest = await prisma.truck_quote_requests.findUnique({ where: { id } });

    if (!quoteRequest) {
      return NextResponse.json({ success: false, message: 'Quote request not found' }, { status: 404 });
    }

    const cancellableStatuses = ['PENDING', 'QUOTES_RECEIVED'];
    if (!cancellableStatuses.includes(quoteRequest.status)) {
      return NextResponse.json({ success: false, message: 'This request cannot be cancelled' }, { status: 400 });
    }

    await prisma.truck_quote_requests.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true, message: 'Quote request cancelled successfully' });
  } catch (error) {
    logger.error('Error cancelling truck quote request', error);
    return NextResponse.json({ success: false, message: 'Failed to cancel request' }, { status: 500 });
  }
}
