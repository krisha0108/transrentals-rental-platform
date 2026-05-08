// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
import { sendQuoteRequestNotificationToVendors } from '@/lib/utils/vendor-notification-sender';
export const dynamic = 'force-dynamic';

// Helper to generate request number
function generateRequestNumber(): string {
  const prefix = 'LQR'; // Luxury Quote Request
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// POST - Customer creates a Luxury Quote Request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      // Customer details
      customerName,
      customerEmail,
      customerPhone,
      customerId,

      // Trip type & occasion
      tripType, // local, outstation, airport
      occasion, // wedding, corporate, personal, airport, anniversary

      // Vehicle preference
      vehicle_category,
      vehicleCategoryName,
      passengers,
      specificModel,

      // Route
      pickupCity,
      pickupAddress,
      dropCity,
      dropAddress,
      routeDetails,

      // Dates
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      tripDays,
      tripHours,

      // Package (for local trips)
      packageType,

      // Requirements
      requirements,
      needChauffeur = true,
      needDecoration = false,
      decorationType,

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

    if (!pickupCity || !pickupDate || !vehicle_category) {
      return NextResponse.json(
        { error: 'Trip details are required (pickupCity, pickupDate, vehicle_category)' },
        { status: 400 }
      );
    }

    // Find location for vendor matching
    const location = await prisma.locations.findFirst({
      where: {
        OR: [
          { name: { contains: pickupCity } },
          { slug: pickupCity.toLowerCase().replace(/\s+/g, '-') },
        ],
        isActive: true,
      },
    });

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
    const quoteRequest = await prisma.luxury_quote_requests.create({
      data: {
        requestNumber,
        customerId: customerId || null,
        customerName,
        customerEmail,
        customerPhone,
        tripType: tripType || 'local',
        occasion: occasion || null,
        vehicleCategory: vehicle_category,
        vehicleCategoryName: vehicleCategoryName || vehicle_category,
        passengers: passengers || 4,
        specificModel: specificModel || null,
        pickupCity,
        pickupAddress: pickupAddress || null,
        dropCity: dropCity || null,
        dropAddress: dropAddress || null,
        routeDetails: routeDetails || null,
        pickupDate: new Date(pickupDate),
        pickupTime: pickupTime || '10:00',
        returnDate: returnDate ? new Date(returnDate) : null,
        returnTime: returnTime || null,
        tripDays: calculatedTripDays,
        tripHours: tripHours || null,
        packageType: packageType || null,
        requirements: requirements || null,
        needChauffeur,
        needDecoration,
        decorationType: decorationType || null,
        budgetMin: budgetMin || null,
        budgetMax: budgetMax || null,
        locationId: location?.id || null,
        status: 'PENDING',
        expiresAt,
        quotesOpenTill,
      },
    });

    // Travel-agent PERSONAL tagging — resolve customer (id → email → phone)
    // and write travelAgentId + bookingMode='PERSONAL' if the customer is
    // linked to a travel agent.
    try {
      let lookupId: string | null = customerId || null;
      if (!lookupId && customerEmail) {
        const c = await prisma.customers.findFirst({
          where: { email: String(customerEmail).toLowerCase() }, select: { id: true },
        });
        if (c) lookupId = c.id;
      }
      if (!lookupId && customerPhone) {
        const c = await prisma.customers.findFirst({
          where: { phone: String(customerPhone) }, select: { id: true },
        });
        if (c) lookupId = c.id;
      }
      if (lookupId) {
        const linkRows: any[] = await (prisma as any).$queryRawUnsafe(
          `SELECT linkedTravelAgentId FROM customers WHERE id = ? LIMIT 1`, lookupId,
        );
        const agentId = linkRows[0]?.linkedTravelAgentId || null;
        if (agentId) {
          await (prisma as any).$executeRawUnsafe(
            `UPDATE luxury_quote_requests SET travelAgentId = ?, bookingMode = ? WHERE id = ?`,
            agentId, 'PERSONAL', quoteRequest.id,
          );
        }
      }
    } catch (e) { console.error('[luxury-quote-requests] TA tag failed', e); }

    // Non-blocking vendor notification
    sendQuoteRequestNotificationToVendors({
      requestId: quoteRequest.id,
      requestNumber: quoteRequest.requestNumber,
      locationId: location?.id || pickupCity,
      locationName: location?.name || pickupCity,
      customerName,
      serviceType: 'luxury',
      serviceDisplayName: 'Luxury Car',
    }).catch((err: any) => console.error('[Notification] Failed:', err));

    return NextResponse.json({
      success: true,
      message: 'Quote request submitted. Vendors will send quotes within 24-48 hours.',
      quoteRequest: {
        id: quoteRequest.id,
        requestNumber: quoteRequest.requestNumber,
        status: quoteRequest.status,
        tripType: quoteRequest.tripType,
        occasion: quoteRequest.occasion,
        chauffeur_vehicle_categories: quoteRequest.vehicleCategoryName,
        pickupCity: quoteRequest.pickupCity,
        dropCity: quoteRequest.dropCity,
        pickupDate: quoteRequest.pickupDate,
        expiresAt: quoteRequest.expiresAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to create luxury quote request', error);
    return NextResponse.json(
      { error: 'Failed to create quote request', details: error?.message },
      { status: 500 }
    );
  }
}

// GET - List Luxury Quote Requests for a customer
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

    const requests = await prisma.luxury_quote_requests.findMany({
      where: whereClause,
      include: {
        luxury_quotes: {
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
        occasion: r.occasion,
        chauffeur_vehicle_categories: r.vehicle_category,
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
        quotes: r.luxury_quotes,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch luxury quote requests', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests', details: error?.message },
      { status: 500 }
    );
  }
}
