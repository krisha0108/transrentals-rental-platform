// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate request number
function generateRequestNumber(): string {
  const prefix = 'BQR'; // Bus Quote Request
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// POST - Customer creates a Bus Quote Request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      // Customer details
      customerName,
      customerEmail,
      customerPhone,
      customerId,

      // Trip type
      tripType, // local, outstation, pilgrimage, wedding, corporate

      // Vehicle preference
      vehicle_category,
      vehicleCategoryName,
      passengers,

      // Route
      pickupCity,
      pickupAddress,
      dropCity,
      dropAddress,
      routeDetails,
      stops, // Array of stops for multi-stop trips

      // Dates
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      tripDays,

      // Requirements
      requirements,
      needAC = true,
      needLuxury = false,
      needSleeper = false,

      // Budget hint
      budgetMin,
      budgetMax,
    } = body;

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone) {
      logger.error('Missing customer details', { customerName, customerEmail, customerPhone });
      return NextResponse.json(
        { error: 'Customer details are required' },
        { status: 400 }
      );
    }

    if (!pickupCity || !pickupDate || !passengers) {
      logger.error('Missing trip details', { pickupCity, pickupDate, passengers });
      return NextResponse.json(
        { error: 'Trip details are required (pickup city, date, and passengers)' },
        { status: 400 }
      );
    }

    // Validate trip type
    if (!tripType || !['local', 'outstation', 'pilgrimage', 'wedding', 'corporate', 'school'].includes(tripType)) {
      logger.error('Invalid trip type', { tripType });
      return NextResponse.json(
        { error: 'Valid trip type is required' },
        { status: 400 }
      );
    }

    // Find location for vendor matching (bus-rental service)
    // MySQL is case-insensitive by default with utf8mb4_general_ci collation
    let location = null;
    try {
      // Try to find location by exact name match first
      location = await prisma.locations.findFirst({
        where: {
          name: { equals: pickupCity },
          isActive: true,
        },
      });

      // If not found, try with contains search
      if (!location) {
        location = await prisma.locations.findFirst({
          where: {
            OR: [
              { name: { contains: pickupCity } },
              { slug: pickupCity.toLowerCase().replace(/\s+/g, '-') },
            ],
            isActive: true,
          },
        });
      }

      logger.info('Location search result', { pickupCity, locationFound: !!location, locationId: location?.id });
    } catch (locError: any) {
      logger.error('Failed to search location', { pickupCity, error: locError?.message });
      // Continue without location - it's optional
    }

    // Generate request number
    const requestNumber = generateRequestNumber();

    // Set expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Quotes open for 48 hours
    const quotesOpenTill = new Date();
    quotesOpenTill.setHours(quotesOpenTill.getHours() + 48);

    // Calculate trip days if not provided
    let calculatedTripDays = tripDays || 1;
    if (returnDate && pickupDate && !tripDays) {
      const diff = new Date(returnDate).getTime() - new Date(pickupDate).getTime();
      calculatedTripDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    // Create the quote request
    let quoteRequest;
    try {
      quoteRequest = await prisma.bus_quote_requests.create({
        data: {
          requestNumber,
          customerId: customerId || null,
          customerName: String(customerName).trim(),
          customerEmail: String(customerEmail).trim().toLowerCase(),
          customerPhone: String(customerPhone).trim(),
          tripType: tripType || 'outstation',
          vehicleCategory: vehicle_category || 'standard',
          vehicleCategoryName: vehicleCategoryName || vehicle_category || 'Standard Bus',
          passengers: parseInt(String(passengers)),
          pickupCity: String(pickupCity).trim(),
          pickupAddress: pickupAddress ? String(pickupAddress).trim() : null,
          dropCity: dropCity ? String(dropCity).trim() : (tripType === 'local' ? pickupCity : null),
          dropAddress: dropAddress ? String(dropAddress).trim() : null,
          routeDetails: routeDetails || null,
          stops: stops || null,
          pickupDate: new Date(pickupDate),
          pickupTime: pickupTime || '06:00',
          returnDate: returnDate ? new Date(returnDate) : null,
          returnTime: returnTime || null,
          tripDays: calculatedTripDays,
          requirements: requirements || null,
          needAC: needAC === true || needAC === 'true',
          needLuxury: needLuxury === true || needLuxury === 'true',
          needSleeper: needSleeper === true || needSleeper === 'true',
          budgetMin: budgetMin ? parseFloat(String(budgetMin)) : null,
          budgetMax: budgetMax ? parseFloat(String(budgetMax)) : null,
          locationId: location?.id || null,
          status: 'PENDING',
          expiresAt,
          quotesOpenTill,
        },
      });
    } catch (dbError: any) {
      logger.error('Database error creating bus quote request', {
        error: dbError?.message,
        code: dbError?.code,
        meta: dbError?.meta,
        requestData: {
          customerName,
          customerEmail,
          tripType,
          pickupCity,
          pickupDate,
          passengers,
        },
      });
      return NextResponse.json(
        {
          error: 'Failed to create quote request',
          details: dbError?.message || 'Database error',
          hint: 'Please check if all required fields are provided correctly'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quote request submitted. Vendors will send quotes within 24-48 hours.',
      quoteRequest: {
        id: quoteRequest.id,
        requestNumber: quoteRequest.requestNumber,
        status: quoteRequest.status,
        tripType: quoteRequest.tripType,
        vehicleCategory: quoteRequest.vehicleCategory,
        vehicleCategoryName: quoteRequest.vehicleCategoryName,
        passengers: quoteRequest.passengers,
        pickupCity: quoteRequest.pickupCity,
        dropCity: quoteRequest.dropCity,
        pickupDate: quoteRequest.pickupDate,
        expiresAt: quoteRequest.expiresAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to create bus quote request', error);
    return NextResponse.json(
      { error: 'Failed to create quote request', details: error?.message },
      { status: 500 }
    );
  }
}

// GET - List Bus Quote Requests for a customer
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

    const requests = await prisma.bus_quote_requests.findMany({
      where: whereClause,
      include: {
        bus_quotes: {
          where: { status: { in: ['SENT', 'VIEWED'] } },
          select: {
            id: true,
            quoteNumber: true,
            vendorId: true,
            totalAmount: true,
            status: true,
            validTill: true,
          },
          orderBy: { totalAmount: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        requestNumber: r.requestNumber,
        tripType: r.tripType,
        vehicleCategory: r.vehicleCategory,
        vehicleCategoryName: r.vehicleCategoryName,
        passengers: r.passengers,
        pickupCity: r.pickupCity,
        dropCity: r.dropCity,
        pickupDate: r.pickupDate,
        pickupTime: r.pickupTime,
        returnDate: r.returnDate,
        tripDays: r.tripDays,
        status: r.status,
        totalQuotesReceived: r.totalQuotesReceived,
        quotes: r.bus_quotes,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch bus quote requests', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests', details: error?.message },
      { status: 500 }
    );
  }
}
