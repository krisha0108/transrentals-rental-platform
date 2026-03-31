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

    const quoteRequest = await prisma.equipment_quote_requests.findUnique({
      where: { id },
      include: {
        equipment_quotes: {
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
    const quotes = quoteRequest.equipment_quotes.map((quote) => ({
      id: quote.id,
      vendorId: quote.vendorId,
      vendorName: quote.vendors?.businessName || 'Vendor',
      vendorRating: quote.vendors?.rating || 0,
      vendorTotalRentals: 0,
      equipmentModel: quote.equipmentModel,
      equipmentYear: quote.equipmentYear,
      totalAmount: quote.totalAmount,
      advanceAmount: quote.advanceAmount || 0,
      advancePercent: quote.advancePercent || 0,
      dailyRate: quote.dailyRate || 0,
      deliveryCharges: quote.deliveryCharges || 0,
      operatorCharges: quote.operatorCharges || 0,
      fuelCharges: quote.fuelCharges || 0,
      securityDeposit: quote.securityDeposit || 0,
      inclusions: quote.inclusions || [],
      exclusions: quote.exclusions || [],
      termsConditions: quote.termsConditions || [],
      notes: quote.notes,
      validUntil: quote.validTill,
      status: quote.status,
      createdAt: quote.createdAt,
    }));

    // Transform request for frontend
    // Schema has: rentalDuration (type: daily/weekly/monthly), rentalDays (number), deliveryCity (not city)
    const transformedRequest = {
      id: quoteRequest.id,
      requestNumber: quoteRequest.requestNumber,
      equipmentCategory: quoteRequest.equipmentCategory,
      equipmentType: quoteRequest.equipmentType,
      quantity: quoteRequest.quantity,
      rentalDuration: quoteRequest.rentalDays,
      durationUnit: quoteRequest.rentalDuration,
      city: quoteRequest.deliveryCity,
      deliveryAddress: quoteRequest.deliveryAddress,
      startDate: quoteRequest.startDate,
      needOperator: quoteRequest.needOperator,
      requirements: quoteRequest.requirements,
      status: quoteRequest.status,
    };

    return NextResponse.json({
      success: true,
      request: transformedRequest,
      quotes,
    });
  } catch (error) {
    logger.error('Error fetching equipment quote request', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch quote request' },
      { status: 500 }
    );
  }
}
