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
  const prefix = 'SDQ'; // Self-Drive Quote
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// GET - Get vendor's submitted self-drive quotes
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
      prisma.self_drive_quotes.findMany({
        where: whereClause,
        include: {
          self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests: {
            select: {
              id: true,
              requestNumber: true,
              customerName: true,
              vehicleCategoryName: true,
              transmission: true,
              locationName: true,
              pickupDate: true,
              dropDate: true,
              totalDays: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.self_drive_quotes.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      quotes: quotes.map((q: any) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        vehicleName: q.vehicleName,
        vehicleBrand: q.vehicleBrand,
        vehicleCategory: q.vehicleCategory,
        transmission: q.transmission,
        fuelType: q.fuelType,
        dailyRate: q.dailyRate,
        grandTotal: q.grandTotal,
        advanceAmount: q.advanceAmount,
        advancePercent: q.advancePercent,
        kmLimitPerDay: q.kmLimitPerDay,
        extraKmRate: q.extraKmRate,
        status: q.status,
        validTill: q.validTill,
        viewCount: q.viewCount,
        request: q.self_drive_quote_requests_self_drive_quotes_requestIdToself_drive_quote_requests,
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
    logger.error('Failed to fetch vendor self-drive quotes', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Vendor submits a quote for a self-drive request
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
      vendorFleetId, // Fleet vehicle ID from vendor's fleet

      // Vehicle details
      vehicleModelId,
      vehicleName,
      vehicleBrand,
      vehicle_category,
      vehicleType,
      transmission,
      fuelType,
      seats,
      registrationNumber,
      vehicleYear,
      vehicleImages,
      vehicleFeatures,

      // Pricing
      dailyRate,
      securityDeposit,
      platformFee = 0, // Removed platform fee
      gstPercent = 0,  // Removed GST

      // KM limits
      kmLimitPerDay = 200,
      extraKmRate = 10,

      // Delivery charges (if applicable)
      deliveryCharges = 0,
      pickupCharges = 0,

      // Advance Payment (vendor decides)
      advancePercent = 30, // 20-50%

      // Terms
      inclusions,
      exclusions,
      termsConditions,

      // Validity (days - vendor decides)
      validityDays = 3, // 1-7 days

      // Vendor message
      vendorMessage,
    } = body;

    // Validate required fields
    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    if (!vehicleName || !dailyRate || !securityDeposit) {
      return NextResponse.json(
        { error: 'Vehicle details and pricing are required' },
        { status: 400 }
      );
    }

    // Validate advance percent (20-50%)
    if (advancePercent < 20 || advancePercent > 50) {
      return NextResponse.json(
        { error: 'Advance percentage must be between 20% and 50%' },
        { status: 400 }
      );
    }

    // Validate validity days (1-7)
    if (validityDays < 1 || validityDays > 7) {
      return NextResponse.json(
        { error: 'Quote validity must be between 1 and 7 days' },
        { status: 400 }
      );
    }

    // Get the quote request
    const quoteRequest = await prisma.self_drive_quote_requests.findUnique({
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
    const existingQuote = await prisma.self_drive_quotes.findFirst({
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

    // Calculate pricing (no GST, no platform fee)
    const totalDays = quoteRequest.totalDays;
    const baseAmount = dailyRate * totalDays;
    const gstAmount = 0; // GST removed
    const grandTotal = baseAmount + deliveryCharges + pickupCharges;
    const advanceAmount = Math.round(grandTotal * advancePercent / 100);

    // Set validity
    const validTill = new Date();
    validTill.setDate(validTill.getDate() + validityDays);

    // Create the quote
    const quote = await prisma.self_drive_quotes.create({
      data: {
        id: generateId(),
        quoteNumber,
        requestId,
        vendorId: vendorId,
        vendorFleetId: vendorFleetId || null,
        vehicleModelId: vehicleModelId || null,
        vehicleName,
        vehicleBrand: vehicleBrand || null,
        vehicleCategory: vehicle_category || quoteRequest.vehicleCategory || null,
        vehicleType: vehicleType || null,
        transmission: transmission || null,
        fuelType: fuelType || null,
        seats: seats || null,
        registrationNumber: registrationNumber || null,
        vehicleYear: vehicleYear || null,
        vehicleImages: vehicleImages ? JSON.stringify(vehicleImages) : null,
        vehicleFeatures: vehicleFeatures ? JSON.stringify(vehicleFeatures) : null,
        dailyRate,
        baseAmount,
        gstAmount: 0,
        platformFee: 0,
        securityDeposit,
        grandTotal,
        kmLimitPerDay,
        extraKmRate,
        deliveryCharges,
        pickupCharges,
        advancePercent,
        advanceAmount,
        inclusions: inclusions ? JSON.stringify(inclusions) : null,
        exclusions: exclusions ? JSON.stringify(exclusions) : null,
        termsConditions: termsConditions ? JSON.stringify(termsConditions) : null,
        vendorMessage: vendorMessage || null,
        validTill,
        validityDays,
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // Update quote request stats
    await prisma.self_drive_quote_requests.update({
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
        dailyRate: quote.dailyRate,
        grandTotal: quote.grandTotal,
        advanceAmount: quote.advanceAmount,
        advancePercent: quote.advancePercent,
        kmLimitPerDay: quote.kmLimitPerDay,
        extraKmRate: quote.extraKmRate,
        validTill: quote.validTill,
        status: quote.status,
      },
    });
  } catch (error: any) {
    logger.error('Failed to submit self-drive quote', error);
    return NextResponse.json(
      { error: 'Failed to submit quote', details: error?.message },
      { status: 500 }
    );
  }
}
