import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';
import { sendQuoteRequestNotificationToVendors } from '@/lib/utils/vendor-notification-sender';
import { createB2BBookingSafe } from '@/lib/b2b/booking-number';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Helper to generate request number
function generateRequestNumber(): string {
  const prefix = 'LQR';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');
  return `${prefix}-${year}-${random}`;
}

function generateB2BId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

/**
 * POST - Customer creates a Luxury Quote Request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      customerName,
      customerEmail,
      customerPhone,
      customerId,
      tripType,
      occasion,
      vehicle_category,
      vehicleCategoryName,
      passengers,
      specificModel,
      pickupCity,
      pickupAddress,
      dropCity,
      dropAddress,
      routeDetails,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      tripDays,
      tripHours,
      packageType,
      requirements,
      needChauffeur = true,
      needDecoration = false,
      decorationType,
      budgetMin,
      budgetMax,
      taBookingMode, numberOfVehicles, numberOfEmployees, // Phase 7 — TA Personal/Company
    } = body;

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { success: false, message: 'Customer details are required' },
        { status: 400 }
      );
    }

    if (!pickupCity || !pickupDate || !vehicle_category) {
      return NextResponse.json(
        { success: false, message: 'Trip details are required (pickupCity, pickupDate, vehicle_category)' },
        { status: 400 }
      );
    }

    // ============ TRAVEL AGENT — COMPANY FLOW ============
    // COMPANY-mode TA bookings route into b2b_bookings (manager queue).
    // PERSONAL falls through to the normal quote-request flow (auto-tagged below).
    if (taBookingMode === 'COMPANY') {
      let taCustomer: any = null;
      if (customerId) taCustomer = await prisma.customers.findUnique({ where: { id: customerId } });
      if (!taCustomer && customerEmail) {
        taCustomer = await prisma.customers.findFirst({ where: { email: String(customerEmail).toLowerCase() } });
      }
      if (!taCustomer && customerPhone) {
        taCustomer = await prisma.customers.findFirst({ where: { phone: customerPhone } });
      }
      if (taCustomer) {
        const linkedRows: any[] = await (prisma as any).$queryRawUnsafe(
          `SELECT linkedTravelAgentId FROM customers WHERE id = ? LIMIT 1`, taCustomer.id,
        );
        const linkedTravelAgentId: string | null = linkedRows[0]?.linkedTravelAgentId || null;
        if (linkedTravelAgentId) {
          const agentRows: any[] = await (prisma as any).$queryRawUnsafe(
            `SELECT agencyName, ownerName, phone FROM travel_agents WHERE id = ? LIMIT 1`, linkedTravelAgentId,
          );
          const agencyName = agentRows[0]?.agencyName || taCustomer.name;
          const agentPhone: string | null = agentRows[0]?.phone || null;
          let resolvedCustomerPhone: string = taCustomer.phone;
          if (agentPhone && (typeof resolvedCustomerPhone !== 'string' || resolvedCustomerPhone.startsWith('ta-'))) {
            resolvedCustomerPhone = agentPhone;
          }
          const luxuryPreference = {
            vehicleCategoryName: vehicleCategoryName || vehicle_category || 'Luxury Car',
            occasion: occasion || null,
            specificModel: specificModel || null,
            needChauffeur, needDecoration,
            decorationType: decorationType || null,
            packageType: packageType || null,
            requirements: requirements || null,
          };
          const taBooking = await createB2BBookingSafe('TA-CO', {
            id: generateB2BId(),
            customerId: taCustomer.id,
            customerName: taCustomer.name,
            customerEmail: taCustomer.email,
            customerPhone: resolvedCustomerPhone,
            companyName: agencyName,
            serviceType: 'luxury',
            vehiclesRequired: numberOfVehicles && parseInt(numberOfVehicles) > 0 ? parseInt(numberOfVehicles) : 1,
            passengerCount: passengers ? parseInt(String(passengers)) : null,
            vehicleCategory: vehicleCategoryName || vehicle_category || 'Luxury Car',
            pickupLocation: pickupCity ? String(pickupCity).trim() : null,
            dropLocation: dropCity ? String(dropCity).trim() : null,
            tripType: tripType || 'local',
            scheduledDate: new Date(pickupDate),
            scheduledTime: pickupTime || '10:00',
            returnDate: returnDate ? new Date(returnDate) : null,
            returnTime: returnTime || null,
            specialNotes: JSON.stringify(luxuryPreference),
            status: 'OPEN_FOR_QUOTES',
            travelAgentId: linkedTravelAgentId,
            bookingMode: taBookingMode,
          });
          return NextResponse.json({
            success: true,
            isTravelAgent: true,
            bookingMode: taBookingMode,
            message: 'Company luxury car booking sent to manager. Quote will be shared shortly.',
            booking: { id: taBooking.id, bookingNumber: taBooking.bookingNumber, status: taBooking.status },
            redirect_to: `/customer/b2b-bookings/${taBooking.id}?customer_id=${taCustomer.id}`,
          });
        }
      }
      // Couldn't link → fall through to the normal quote-request flow.
    }

    // Find location
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

    // Calculate trip days
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
        source: body.source || 'web',
      },
    });

    // Travel-agent PERSONAL tagging (COMPANY already returned above).
    try {
      let lookupId: string | null = customerId || null;
      if (!lookupId && customerEmail) {
        const c = await prisma.customers.findFirst({ where: { email: String(customerEmail).toLowerCase() }, select: { id: true } });
        if (c) lookupId = c.id;
      }
      if (!lookupId && customerPhone) {
        const c = await prisma.customers.findFirst({ where: { phone: String(customerPhone) }, select: { id: true } });
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
    } catch (e) { console.error('[customer/luxury-quote-requests] TA tag failed', e); }

    logger.info(`Luxury quote request created: ${requestNumber}`, {
      customerId,
      pickupCity,
      vehicle_category,
    });

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
      message: 'Quote request submitted successfully! Vendors will send quotes within 24-48 hours.',
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
    logger.error('Customer luxury quote request creation failed', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create quote request', details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * GET - Get customer's luxury quote requests
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    const status = searchParams.get('status');

    if (!customerId && !phone && !email) {
      return NextResponse.json(
        { success: false, message: 'Customer ID, phone, or email required' },
        { status: 400 }
      );
    }

    const whereClause: any = {};

    if (customerId) {
      whereClause.OR = [
        { customerId: customerId },
        { customerPhone: phone || undefined },
        { customerEmail: email || undefined },
      ];
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
          where: { status: { in: ['SENT', 'VIEWED', 'ACCEPTED', 'EXPIRED'] } },
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                phone: true,
                email: true,
                logo: true,
              },
            },
          },
          orderBy: { totalAmount: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedRequests = requests.map((r) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      tripType: r.tripType,
      occasion: r.occasion,
      chauffeur_vehicle_categories: r.vehicle_category,
      vehicleCategoryName: r.vehicleCategoryName,
      specificModel: r.specificModel,
      passengers: r.passengers,
      pickupCity: r.pickupCity,
      pickupAddress: r.pickupAddress,
      dropCity: r.dropCity,
      dropAddress: r.dropAddress,
      pickupDate: r.pickupDate,
      pickupTime: r.pickupTime,
      returnDate: r.returnDate,
      returnTime: r.returnTime,
      tripDays: r.tripDays,
      tripHours: r.tripHours,
      packageType: r.packageType,
      requirements: r.requirements,
      needChauffeur: r.needChauffeur,
      needDecoration: r.needDecoration,
      decorationType: r.decorationType,
      status: r.status,
      totalQuotesReceived: r.totalQuotesReceived,
      quotesViewed: r.quotesViewed,
      quotes: r.luxury_quotes.map((q) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        vendorId: q.vendorId,
        vendor: q.vendor,
        vehicleName: q.vehicleName,
        vehicleNumber: q.vehicleNumber,
        vehicle_models: q.vehicle_models,
        baseAmount: q.baseAmount,
        totalAmount: q.totalAmount,
        advanceAmount: q.advanceAmount,
        status: q.status,
        validTill: q.validTill,
        createdAt: q.createdAt,
      })),
      expiresAt: r.expiresAt,
      quotesOpenTill: r.quotesOpenTill,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      success: true,
      requests: formattedRequests,
      total: formattedRequests.length,
    });
  } catch (error: any) {
    logger.error('Failed to fetch customer luxury quote requests', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch requests', details: error?.message },
      { status: 500 }
    );
  }
}
