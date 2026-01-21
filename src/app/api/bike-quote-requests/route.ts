// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate request number
function generateRequestNumber(): string {
  const prefix = 'BKQ'; // Bike Quote Request
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// POST - Customer creates a Bike Quote Request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      // Customer details
      customerName,
      customerEmail,
      customerPhone,
      customerId,

      // Vehicle preference
      vehicleModelId,
      vehicleModelName,
      vehicleBrand,
      vehicle_category,
      vehicleCategoryName,

      // Location
      locationId,
      locationName,

      // Dates
      pickupDate,
      pickupTime,
      dropDate,
      dropTime,

      // Requirements
      helmetsRequired = 1,
      customerNotes,

      // Budget hint
      budgetMin,
      budgetMax,
    } = body;

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: 'Customer details are required' },
        { status: 400 }
      );
    }

    if (!locationId || !pickupDate || !dropDate) {
      return NextResponse.json(
        { error: 'Location and dates are required' },
        { status: 400 }
      );
    }

    // Find location - could be ID, slug, or name
    let location = await prisma.locations.findUnique({
      where: { id: locationId },
      select: { id: true, name: true },
    });

    // If not found by ID, try by slug or name
    if (!location) {
      location = await prisma.locations.findFirst({
        where: {
          OR: [
            { slug: locationId },
            { name: locationId },
          ],
        },
        select: { id: true, name: true },
      });
    }

    if (!location) {
      return NextResponse.json(
        { error: 'Invalid location', locationId },
        { status: 400 }
      );
    }

    // Validate customerId if provided - set to null if customer doesn't exist
    let validCustomerId: string | null = null;
    if (customerId) {
      const customerExists = await prisma.customers.findUnique({
        where: { id: customerId },
        select: { id: true },
      });
      if (customerExists) {
        validCustomerId = customerId;
      } else {
        console.warn(`Customer ID ${customerId} not found in database, setting to null`);
      }
    }

    // Generate request number
    const requestNumber = generateRequestNumber();

    // Set expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Quotes open for 48 hours
    const quotesOpenTill = new Date();
    quotesOpenTill.setHours(quotesOpenTill.getHours() + 48);

    // Calculate total days
    const pickupDateTime = new Date(pickupDate);
    const dropDateTime = new Date(dropDate);
    const totalDays = Math.max(
      1,
      Math.ceil((dropDateTime.getTime() - pickupDateTime.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Create the quote request
    const quoteRequest = await prisma.bike_quote_requests.create({
      data: {
        requestNumber,
        customerId: validCustomerId,
        customerName,
        customerEmail,
        customerPhone,
        vehicleModelId: vehicleModelId || null,
        vehicleModelName: vehicleModelName || null,
        vehicleBrand: vehicleBrand || null,
        vehicleCategory: vehicle_category || null,
        vehicleCategoryName: vehicleCategoryName || vehicle_category || null,
        locationId: location.id,
        locationName: location.name,
        pickupDate: pickupDateTime,
        pickupTime: pickupTime || '10:00',
        dropDate: dropDateTime,
        dropTime: dropTime || '10:00',
        totalDays,
        helmetsRequired,
        customerNotes: customerNotes || null,
        budgetMin: budgetMin || null,
        budgetMax: budgetMax || null,
        status: 'PENDING',
        expiresAt,
        quotesOpenTill,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Quote request submitted. Vendors will send quotes within 24-48 hours.',
      quoteRequest: {
        id: quoteRequest.id,
        requestNumber: quoteRequest.requestNumber,
        status: quoteRequest.status,
        chauffeur_vehicle_categories: quoteRequest.vehicleCategoryName,
        vehicleModelName: quoteRequest.vehicle_modelsName,
        locationName: quoteRequest.locationName,
        pickupDate: quoteRequest.pickupDate,
        dropDate: quoteRequest.dropDate,
        totalDays: quoteRequest.totalDays,
        expiresAt: quoteRequest.expiresAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to create bike quote request', error);
    return NextResponse.json(
      { error: 'Failed to create quote request', details: error?.message },
      { status: 500 }
    );
  }
}

// GET - List Bike Quote Requests for a customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    const status = searchParams.get('status');

    if (!customerId && !phone && !email) {
      return NextResponse.json(
        { error: 'Customer ID, phone, or email required' },
        { status: 400 }
      );
    }

    const whereClause: any = {};

    if (customerId) {
      whereClause.customerId = customerId;
    } else if (phone) {
      whereClause.customerPhone = phone;
    } else if (email) {
      whereClause.customerEmail = email;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const requests = await prisma.bike_quote_requests.findMany({
      where: whereClause,
      include: {
        bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
          where: { status: { in: ['SENT', 'VIEWED'] } },
          select: {
            id: true,
            quoteNumber: true,
            vendorId: true,
            vehicleName: true,
            dailyRate: true,
            grandTotal: true,
            advanceAmount: true,
            advancePercent: true,
            status: true,
            validTill: true,
            vendors: {
              select: {
                businessName: true,
                rating: true,
              },
            },
          },
          orderBy: { grandTotal: 'asc' },
        },
        locations: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        vehicleModelName: r.vehicle_modelsName,
        vehicleBrand: r.vehicleBrand,
        chauffeur_vehicle_categories: r.vehicle_category,
        vehicleCategoryName: r.vehicleCategoryName,
        locationId: r.locationId,
        locationName: r.locationName,
        pickupDate: r.pickupDate,
        pickupTime: r.pickupTime,
        dropDate: r.dropDate,
        dropTime: r.dropTime,
        totalDays: r.totalDays,
        helmetsRequired: r.helmetsRequired,
        status: r.status,
        totalQuotesReceived: r.totalQuotesReceived,
        quotes: r.bike_quotes_bike_quotes_requestIdTobike_quote_requests,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch bike quote requests', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests', details: error?.message },
      { status: 500 }
    );
  }
}
