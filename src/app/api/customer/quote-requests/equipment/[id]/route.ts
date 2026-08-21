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
    // inclusions / exclusions / termsConditions are stored as a JSON string.
    // Send them as real arrays — handing the raw string to the client left it
    // splitting on commas, which turned '["A","B"]' into '["A"' + '"B"]'.
    const toList = (raw) => {
      if (Array.isArray(raw)) return raw.filter(Boolean);
      if (typeof raw !== 'string' || !raw.trim()) return [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
        if (parsed && typeof parsed === 'object') return Object.values(parsed).filter(Boolean);
        return [];
      } catch {
        // Not JSON — fall back to the comma-separated form.
        return raw.split(',').map((s) => s.trim()).filter(Boolean);
      }
    };

    const quotes = quoteRequest.equipment_quotes.map((quote) => ({
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      vendorId: quote.vendorId,
      vendorName: quote.vendors?.businessName || 'Vendor',
      vendorRating: quote.vendors?.rating || 0,
      vendorTotalRentals: 0,
      equipmentName: quote.equipmentName,
      equipmentModel: quote.equipmentModel,
      equipmentYear: quote.equipmentYear,
      totalAmount: quote.totalAmount,
      baseAmount: quote.baseAmount || 0,
      advanceAmount: quote.advanceAmount || 0,
      advancePercent: quote.advancePercent || 0,
      dailyRate: quote.dailyRate || 0,
      weeklyRate: quote.weeklyRate || 0,
      monthlyRate: quote.monthlyRate || 0,
      deliveryCharges: quote.deliveryCharges || 0,
      pickupCharges: quote.pickupCharges || 0,
      operatorCharges: quote.operatorCharges || 0,
      installationCharges: quote.installationCharges || 0,
      fuelCharges: quote.fuelCharges || 0,
      gstAmount: quote.gstAmount || 0,
      securityDeposit: quote.securityDeposit || 0,
      viewCount: quote.viewCount || 0,
      inclusions: toList(quote.inclusions),
      exclusions: toList(quote.exclusions),
      termsConditions: toList(quote.termsConditions),
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
      endDate: quoteRequest.endDate,
      needOperator: quoteRequest.needOperator,
      needDelivery: quoteRequest.needDelivery,
      needInstallation: quoteRequest.needInstallation,
      requirements: quoteRequest.requirements,
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
  } catch (error) {
    logger.error('Error fetching equipment quote request', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch quote request' },
      { status: 500 }
    );
  }
}
