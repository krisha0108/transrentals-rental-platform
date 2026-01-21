// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate a unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// Helper to generate quote number
function generateQuoteNumber(): string {
  const prefix = 'LQ'; // Luxury Quote
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// GET - Get vendor's submitted quotes
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const whereClause: any = { vendorId: vendorId };
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const [quotes, total] = await Promise.all([
      prisma.luxury_quotes.findMany({
        where: whereClause,
        include: {
          luxury_quote_requests: {
            select: {
              id: true,
              requestNumber: true,
              customerName: true,
              tripType: true,
              occasion: true,
              pickupCity: true,
              dropCity: true,
              pickupDate: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.luxury_quotes.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      quotes: quotes.map((q: any) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        vehicleName: q.vehicleName,
        vehicleCategory: q.vehicleCategory,
        totalAmount: q.totalAmount,
        status: q.status,
        validTill: q.validTill,
        viewCount: q.viewCount,
        request: q.luxury_quote_requests,
        createdAt: q.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor luxury quotes', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Vendor submits a quote for a request
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    // Get vendor
    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: { id: true, businessName: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      requestId,
      templateId, // Optional - use a saved template
      fleetId, // Optional - fleet vehicle ID if selected from vendor's fleet

      // Vehicle details
      vehicle_category,
      vehicleName,
      vehicleNumber,
      vehicle_model,
      vehicleYear,
      vehicleFeatures,
      vehicleImages,

      // Driver details (optional at quote stage)
      driverName,
      driverPhone,
      driverExperience,

      // Pricing
      baseAmount,
      chauffeurCharges = 0,
      decorationCharges = 0,
      perKmRate,
      perHourRate,
      includedKm,
      includedHours,
      fuelCharges = 0,
      tollEstimate = 0,
      parkingEstimate = 0,
      nightHaltCharges = 0,
      gstAmount = 0,

      // Advance Payment
      advanceAmount,
      advancePercent = 30,

      // Extra charges info
      extraKmRate,
      extraHourRate,

      // Vendor message
      vendorMessage,

      // Content
      inclusions = [],
      exclusions = [],
      termsConditions = [],

      // Negotiation
      isNegotiable = false,

      // Validity (days)
      validityDays = 3,
    } = body;

    // Validate required fields
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    if (!vehicleName || !baseAmount) {
      return NextResponse.json(
        { error: 'Vehicle name and base amount are required' },
        { status: 400 }
      );
    }

    // Get the quote request
    const quoteRequest = await prisma.luxury_quote_requests.findUnique({
      where: { id: requestId },
    });

    if (!quoteRequest) {
      return NextResponse.json({ error: 'Quote request not found' }, { status: 404 });
    }

    // Check if request is still open
    if (quoteRequest.status !== 'PENDING' && quoteRequest.status !== 'QUOTES_RECEIVED') {
      return NextResponse.json(
        { error: 'This request is no longer accepting quotes' },
        { status: 400 }
      );
    }

    // Check if quotes are still open
    if (quoteRequest.quotesOpenTill && new Date() > new Date(quoteRequest.quotesOpenTill)) {
      return NextResponse.json(
        { error: 'Quote submission window has closed' },
        { status: 400 }
      );
    }

    // Check if vendor already quoted
    const existingQuote = await prisma.luxury_quotes.findFirst({
      where: {
        requestId,
        vendorId: vendorId,
      },
    });

    if (existingQuote) {
      return NextResponse.json(
        { error: 'You have already submitted a quote for this request' },
        { status: 400 }
      );
    }

    // Generate quote number
    const quoteNumber = generateQuoteNumber();

    // Calculate total
    const totalAmount = baseAmount + chauffeurCharges + decorationCharges + fuelCharges + tollEstimate + parkingEstimate + nightHaltCharges + gstAmount;

    // Set validity
    const validTill = new Date();
    validTill.setDate(validTill.getDate() + validityDays);

    // Create the quote
    const quote = await prisma.luxury_quotes.create({
      data: {
        id: generateId(),
        quoteNumber,
        requestId,
        vendorId: vendorId,
        templateId: templateId || null,
        fleetId: fleetId || null,
        vehicleCategory: vehicle_category || quoteRequest.vehicleCategory,
        vehicleName,
        vehicleNumber: vehicleNumber || null,
        vehicleModel: vehicle_model || null,
        vehicleYear: vehicleYear || null,
        vehicleFeatures: vehicleFeatures || null,
        vehicleImages: vehicleImages || null,
        driverName: driverName || null,
        driverPhone: driverPhone || null,
        driverExperience: driverExperience || null,
        baseAmount,
        chauffeurCharges,
        decorationCharges,
        perKmRate: perKmRate || null,
        perHourRate: perHourRate || null,
        includedKm: includedKm || null,
        includedHours: includedHours || null,
        fuelCharges,
        tollEstimate,
        parkingEstimate,
        nightHaltCharges,
        gstAmount,
        totalAmount,
        advanceAmount: advanceAmount || Math.round(totalAmount * advancePercent / 100),
        advancePercent,
        extraKmRate: extraKmRate || null,
        extraHourRate: extraHourRate || null,
        inclusions: Array.isArray(inclusions) ? JSON.stringify(inclusions) : (inclusions || null),
        exclusions: Array.isArray(exclusions) ? JSON.stringify(exclusions) : (exclusions || null),
        termsConditions: Array.isArray(termsConditions) ? JSON.stringify(termsConditions) : (termsConditions || null),
        vendorMessage: vendorMessage || null,
        isNegotiable,
        validTill,
        validityDays,
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // Update quote request stats
    await prisma.luxury_quote_requests.update({
      where: { id: requestId },
      data: {
        status: 'QUOTES_RECEIVED',
        totalQuotesReceived: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Quote submitted successfully',
      quote: {
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        vehicleName: quote.vehicleName,
        totalAmount: quote.totalAmount,
        validTill: quote.validTill,
        status: quote.status,
      },
    });
  } catch (error: any) {
    logger.error('Failed to submit luxury quote', error);
    return NextResponse.json(
      { error: 'Failed to submit quote', details: error?.message },
      { status: 500 }
    );
  }
}
