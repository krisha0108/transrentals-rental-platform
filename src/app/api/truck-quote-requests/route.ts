// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { sanitizeInput, isValidEmail, isValidPhone, sanitizePhone } from '@/lib/utils/sanitize';
import { smartRateLimit, detectDuplicate, getClientIdentifier, hashBookingData } from '@/lib/utils/smart-rate-limit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import logger from '@/lib/security/logger';
import { sendQuoteRequestNotificationToVendors } from '@/lib/utils/vendor-notification-sender';
export const dynamic = 'force-dynamic';

function generateRequestNumber(): string {
  const prefix = 'TQR';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// POST - Customer creates a Truck Quote Request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ===== RATE LIMITING =====
    const clientId = getClientIdentifier(request);
    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session?.user;

    const rateLimitCheck = await smartRateLimit(clientId, isAuthenticated, body);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: rateLimitCheck.error,
          requiresCaptcha: rateLimitCheck.requiresCaptcha,
          type: 'rate_limit',
        },
        { status: 429 }
      );
    }

    // Check for duplicate bookings (bot detection)
    const bookingHash = hashBookingData(body);
    const duplicateCheck = await detectDuplicate(bookingHash);
    if (duplicateCheck.isDuplicate) {
      return NextResponse.json(
        {
          error: duplicateCheck.error,
          type: 'duplicate_booking',
        },
        { status: 400 }
      );
    }

    let {
      customerName, customerEmail, customerPhone, customerId,
      serviceType, vehicle_category, vehicleCategoryName,
      truckBodyType, tripDirection,
      goodsType, goodsDescription, estimatedWeight, estimatedVolume,
      requiresLabour, labourCount,
      pickupCity, pickupAddress, pickupPincode, pickupFloor, hasPickupLift,
      dropCity, dropAddress, dropPincode, dropFloor, hasDropLift, estimatedDistance,
      pickupDate, pickupTime, expectedDeliveryDate, expectedDeliveryTime,
      isFlexibleDate, hasMultipleStops, multipleStopsDetails,
      receiverName, receiverPhone, requiresPOD,
      requirements, needInsurance, needPackaging,
      budgetMin, budgetMax,
    } = body;

    // ===== INPUT SANITIZATION (XSS Protection) =====
    customerName = sanitizeInput(customerName);
    vehicleCategoryName = sanitizeInput(vehicleCategoryName);
    goodsType = sanitizeInput(goodsType);
    goodsDescription = sanitizeInput(goodsDescription);
    pickupCity = sanitizeInput(pickupCity);
    pickupAddress = sanitizeInput(pickupAddress);
    dropCity = sanitizeInput(dropCity);
    dropAddress = sanitizeInput(dropAddress);
    requirements = sanitizeInput(requirements);
    // TA shadow placeholder phone (`ta-<id>`) — keep as-is, skip sanitize/validate.
    let isTaPlaceholderPhone = false;
    if (typeof customerPhone === 'string' && customerPhone.startsWith('ta-')) {
      isTaPlaceholderPhone = true;
      try {
        const ag: any = await (prisma as any).travel_agents.findUnique({ where: { id: customerPhone.slice(3) } });
        if (ag?.phone) { customerPhone = ag.phone; isTaPlaceholderPhone = false; }
      } catch { /* keep placeholder */ }
    }
    if (!isTaPlaceholderPhone) customerPhone = sanitizePhone(customerPhone);

    if (!customerName || !customerEmail || !customerPhone) {
      return NextResponse.json({ error: 'Customer details are required' }, { status: 400 });
    }

    // ===== EMAIL & PHONE VALIDATION =====
    if (customerEmail && !isValidEmail(customerEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (!isTaPlaceholderPhone && customerPhone && !isValidPhone(customerPhone)) {
      return NextResponse.json({ error: 'Invalid phone number. Must be 10 digits starting with 6-9' }, { status: 400 });
    }
    if (!pickupCity || !dropCity || !pickupDate || !vehicle_category || !goodsType) {
      return NextResponse.json({ error: 'Trip and goods details are required' }, { status: 400 });
    }

    // ===== DATE VALIDATION =====
    const pickup = new Date(pickupDate);
    if (isNaN(pickup.getTime())) {
      return NextResponse.json({ error: 'Invalid pickup date format. Please provide a valid date.' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (pickup < today) {
      return NextResponse.json({ error: 'Pickup date cannot be in the past' }, { status: 400 });
    }

    // MySQL is case-insensitive by default with utf8mb4_general_ci collation
    const location = await prisma.locations.findFirst({
      where: {
        OR: [
          { name: { contains: pickupCity } },
          { slug: pickupCity.toLowerCase().replace(/\s+/g, '-') },
        ],
        isActive: true,
      },
    });

    const requestNumber = generateRequestNumber();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const quotesOpenTill = new Date();
    quotesOpenTill.setHours(quotesOpenTill.getHours() + 48);

    const validBodyTypes = ['OPEN', 'CLOSED_BODY', 'CONTAINER', 'TRAILER', 'LCV', 'REFRIGERATED', 'FLATBED', 'OTHER'];
    const validTripDirections = ['ONE_WAY', 'ROUND_TRIP'];
    const safeBodyType = truckBodyType && validBodyTypes.includes(truckBodyType) ? truckBodyType : null;
    const safeTripDirection = tripDirection && validTripDirections.includes(tripDirection) ? tripDirection : 'ONE_WAY';
    const parsedExpectedDelivery = expectedDeliveryDate
      ? (() => {
          const d = new Date(expectedDeliveryDate);
          return isNaN(d.getTime()) ? null : d;
        })()
      : null;

    const quoteRequest = await (prisma as any).truck_quote_requests.create({
      data: {
        requestNumber,
        customerId: customerId || null,
        customerName, customerEmail, customerPhone,
        serviceType: serviceType || 'intercity',
        vehicleCategory: vehicle_category,
        vehicleCategoryName: vehicleCategoryName || vehicle_category,
        truckBodyType: safeBodyType,
        tripDirection: safeTripDirection,
        goodsType,
        goodsDescription: goodsDescription || null,
        estimatedWeight: estimatedWeight || null,
        estimatedVolume: estimatedVolume || null,
        requiresLabour: requiresLabour || false,
        labourCount: labourCount || null,
        pickupCity,
        pickupAddress: pickupAddress || null,
        pickupPincode: pickupPincode || null,
        pickupFloor: pickupFloor || null,
        hasPickupLift: hasPickupLift || false,
        dropCity,
        dropAddress: dropAddress || null,
        dropPincode: dropPincode || null,
        dropFloor: dropFloor || null,
        hasDropLift: hasDropLift || false,
        estimatedDistance: estimatedDistance || null,
        pickupDate: new Date(pickupDate),
        pickupTime: pickupTime || '08:00',
        expectedDeliveryDate: parsedExpectedDelivery,
        expectedDeliveryTime: expectedDeliveryTime || null,
        isFlexibleDate: isFlexibleDate || false,
        hasMultipleStops: hasMultipleStops || false,
        multipleStopsDetails: multipleStopsDetails || null,
        receiverName: receiverName || null,
        receiverPhone: receiverPhone || null,
        requiresPOD: requiresPOD || false,
        requirements: requirements || null,
        needInsurance: needInsurance || false,
        needPackaging: needPackaging || false,
        budgetMin: budgetMin || null,
        budgetMax: budgetMax || null,
        locationId: location?.id || null,
        status: 'PENDING',
        expiresAt,
        quotesOpenTill,
        source: body.source || 'web',
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
            `UPDATE truck_quote_requests SET travelAgentId = ?, bookingMode = ? WHERE id = ?`,
            agentId, 'PERSONAL', quoteRequest.id,
          );
        }
      }
    } catch (e) { console.error('[truck-quote-requests] TA tag failed', e); }

    // Non-blocking vendor notification
    sendQuoteRequestNotificationToVendors({
      requestId: quoteRequest.id,
      requestNumber: quoteRequest.requestNumber,
      locationId: location?.id || pickupCity,
      locationName: location?.name || pickupCity,
      customerName,
      serviceType: 'truck',
      serviceDisplayName: 'Truck Rental',
    }).catch((err: any) => console.error('[Notification] Failed:', err));

    return NextResponse.json({
      success: true,
      message: 'Quote request submitted. Vendors will send quotes within 24-48 hours.',
      quoteRequest: {
        id: quoteRequest.id,
        requestNumber: quoteRequest.requestNumber,
        status: quoteRequest.status,
        chauffeur_vehicle_categories: quoteRequest.vehicleCategoryName,
        goodsType: quoteRequest.goodsType,
        pickupCity: quoteRequest.pickupCity,
        pickupAddress: quoteRequest.pickupAddress,
        dropCity: quoteRequest.dropCity,
        dropAddress: quoteRequest.dropAddress,
        pickupDate: quoteRequest.pickupDate,
        expiresAt: quoteRequest.expiresAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to create truck quote request', error);
    return NextResponse.json({ error: 'Failed to create quote request', details: error?.message }, { status: 500 });
  }
}

// GET - List Truck Quote Requests for a customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');
    const status = searchParams.get('status');

    if (!customerId && !phone && !email) {
      return NextResponse.json({ error: 'Customer ID, phone, or email required' }, { status: 400 });
    }

    const whereClause: any = {};
    if (customerId) whereClause.customerId = customerId;
    else if (phone) whereClause.customerPhone = phone;
    else if (email) whereClause.customerEmail = email;
    if (status && status !== 'all') whereClause.status = status;

    const requests = await prisma.truck_quote_requests.findMany({
      where: whereClause,
      include: {
        truck_quotes: {
          where: { status: { in: ['SENT', 'VIEWED'] } },
          select: { id: true, quoteNumber: true, vendorId: true, totalAmount: true, status: true, validTill: true },
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
        serviceType: r.serviceType,
        chauffeur_vehicle_categories: r.vehicleCategoryName,
        vehicleCategory: r.vehicleCategory,
        vehicleCategoryName: r.vehicleCategoryName,
        truckBodyType: r.truckBodyType,
        tripDirection: r.tripDirection,
        goodsType: r.goodsType,
        goodsDescription: r.goodsDescription,
        estimatedWeight: r.estimatedWeight,
        estimatedVolume: r.estimatedVolume,
        pickupCity: r.pickupCity,
        pickupAddress: r.pickupAddress,
        pickupPincode: r.pickupPincode,
        pickupFloor: r.pickupFloor,
        hasPickupLift: r.hasPickupLift,
        dropCity: r.dropCity,
        dropAddress: r.dropAddress,
        dropPincode: r.dropPincode,
        dropFloor: r.dropFloor,
        hasDropLift: r.hasDropLift,
        pickupDate: r.pickupDate,
        pickupTime: r.pickupTime,
        expectedDeliveryDate: r.expectedDeliveryDate,
        expectedDeliveryTime: r.expectedDeliveryTime,
        requiresLabour: r.requiresLabour,
        labourCount: r.labourCount,
        hasMultipleStops: r.hasMultipleStops,
        multipleStopsDetails: r.multipleStopsDetails,
        receiverName: r.receiverName,
        receiverPhone: r.receiverPhone,
        requiresPOD: r.requiresPOD,
        isFlexibleDate: r.isFlexibleDate,
        needInsurance: r.needInsurance,
        needPackaging: r.needPackaging,
        budgetMin: r.budgetMin,
        budgetMax: r.budgetMax,
        requirements: r.requirements,
        status: r.status,
        totalQuotesReceived: r.totalQuotesReceived,
        quotes: r.truck_quotes,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch truck quote requests', error);
    return NextResponse.json({ error: 'Failed to fetch requests', details: error?.message }, { status: 500 });
  }
}
