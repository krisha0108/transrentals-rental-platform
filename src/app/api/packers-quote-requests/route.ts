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
import { createB2BBookingSafe } from '@/lib/b2b/booking-number';
import crypto from 'crypto';
export const dynamic = 'force-dynamic';

function generateRequestNumber(): string {
  const prefix = 'PQR';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

function generateB2BId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// POST - Customer creates a Packers Quote Request
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
      serviceType, shiftingType, propertySize,
      inventoryList, hasHeavyItems, heavyItemsDesc, hasFragileItems, fragileItemsDesc, hasVehicle, vehicleDetails,
      pickupCity, pickupAddress, pickupFloor, hasPickupLift, pickupParkingDist,
      dropCity, dropAddress, dropFloor, hasDropLift, dropParkingDist,
      preferredDate, isFlexibleDate, flexibleDateRange,
      needPacking, needUnpacking, needStorage, storageDays, needInsurance, insuranceValue,
      requirements, budgetMin, budgetMax,
      taBookingMode, numberOfVehicles, numberOfEmployees, // Phase 7 — TA Personal/Company
    } = body;

    // ===== INPUT SANITIZATION (XSS Protection) =====
    customerName = sanitizeInput(customerName);
    pickupCity = sanitizeInput(pickupCity);
    pickupAddress = sanitizeInput(pickupAddress);
    dropCity = sanitizeInput(dropCity);
    dropAddress = sanitizeInput(dropAddress);
    heavyItemsDesc = sanitizeInput(heavyItemsDesc);
    fragileItemsDesc = sanitizeInput(fragileItemsDesc);
    vehicleDetails = sanitizeInput(vehicleDetails);
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
    if (!pickupCity || !dropCity || !pickupAddress || !dropAddress || !preferredDate || !shiftingType) {
      return NextResponse.json({ error: 'Location and shifting details are required' }, { status: 400 });
    }

    // ===== DATE VALIDATION =====
    const preferred = new Date(preferredDate);
    if (isNaN(preferred.getTime())) {
      return NextResponse.json({ error: 'Invalid preferred date format. Please provide a valid date.' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (preferred < today) {
      return NextResponse.json({ error: 'Preferred date cannot be in the past' }, { status: 400 });
    }

    // ============ TRAVEL AGENT — COMPANY FLOW ============
    // COMPANY-mode TA bookings route into b2b_bookings (manager queue).
    // PERSONAL-mode falls through to the normal quote-request flow (and is
    // auto-tagged bookingMode='PERSONAL' further down).
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
          const packersPreference = {
            shiftingType, propertySize: propertySize || null,
            needPacking: needPacking !== false, needUnpacking: needUnpacking || false,
            needStorage: needStorage || false, storageDays: storageDays || null,
            needInsurance: needInsurance || false, insuranceValue: insuranceValue || null,
            hasHeavyItems: hasHeavyItems || false, hasFragileItems: hasFragileItems || false,
            hasVehicle: hasVehicle || false, requirements: requirements || null,
          };
          const taBooking = await createB2BBookingSafe('TA-CO', {
            id: generateB2BId(),
            customerId: taCustomer.id,
            customerName: taCustomer.name,
            customerEmail: taCustomer.email,
            customerPhone: resolvedCustomerPhone,
            companyName: agencyName,
            serviceType: 'packers',
            vehiclesRequired: numberOfVehicles && parseInt(numberOfVehicles) > 0 ? parseInt(numberOfVehicles) : 1,
            vehicleCategory: shiftingType || 'Packers & Movers',
            pickupLocation: pickupCity ? String(pickupCity).trim() : null,
            dropLocation: dropCity ? String(dropCity).trim() : null,
            tripType: serviceType || 'home-intercity',
            scheduledDate: new Date(preferredDate),
            scheduledTime: '09:00',
            specialNotes: JSON.stringify(packersPreference),
            status: 'OPEN_FOR_QUOTES',
            travelAgentId: linkedTravelAgentId,
            bookingMode: taBookingMode,
          });
          return NextResponse.json({
            success: true,
            isTravelAgent: true,
            bookingMode: taBookingMode,
            message: 'Company packers & movers booking sent to manager. Quote will be shared shortly.',
            booking: { id: taBooking.id, bookingNumber: taBooking.bookingNumber, status: taBooking.status },
            redirect_to: `/customer/b2b-bookings/${taBooking.id}?customer_id=${taCustomer.id}`,
          });
        }
      }
      // Couldn't link → fall through to the normal quote-request flow.
    }

    // MySQL is case-insensitive by default with utf8mb4_general_ci collation
    const location = await prisma.locations.findFirst({
      where: {
        OR: [{ name: { contains: pickupCity } }, { slug: pickupCity.toLowerCase().replace(/\s+/g, '-') }],
        isActive: true,
      },
    });

    const requestNumber = generateRequestNumber();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const quotesOpenTill = new Date();
    quotesOpenTill.setHours(quotesOpenTill.getHours() + 48);

    const quoteRequest = await prisma.packers_quote_requests.create({
      data: {
        requestNumber,
        customerId: customerId || null,
        customerName, customerEmail, customerPhone,
        serviceType: serviceType || 'home-intercity',
        shiftingType,
        propertySize: propertySize || null,
        inventoryList: inventoryList || null,
        hasHeavyItems: hasHeavyItems || false,
        heavyItemsDesc: heavyItemsDesc || null,
        hasFragileItems: hasFragileItems || false,
        fragileItemsDesc: fragileItemsDesc || null,
        hasVehicle: hasVehicle || false,
        vehicleDetails: vehicleDetails || null,
        pickupCity, pickupAddress,
        pickupFloor: pickupFloor || null,
        hasPickupLift: hasPickupLift || false,
        pickupParkingDist: pickupParkingDist || null,
        dropCity, dropAddress,
        dropFloor: dropFloor || null,
        hasDropLift: hasDropLift || false,
        dropParkingDist: dropParkingDist || null,
        preferredDate: new Date(preferredDate),
        isFlexibleDate: isFlexibleDate || false,
        flexibleDateRange: flexibleDateRange || null,
        needPacking: needPacking !== false,
        needUnpacking: needUnpacking || false,
        needStorage: needStorage || false,
        storageDays: storageDays || null,
        needInsurance: needInsurance || false,
        insuranceValue: insuranceValue || null,
        requirements: requirements || null,
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
            `UPDATE packers_quote_requests SET travelAgentId = ?, bookingMode = ? WHERE id = ?`,
            agentId, 'PERSONAL', quoteRequest.id,
          );
        }
      }
    } catch (e) { console.error('[packers-quote-requests] TA tag failed', e); }

    // Non-blocking vendor notification
    sendQuoteRequestNotificationToVendors({
      requestId: quoteRequest.id,
      requestNumber: quoteRequest.requestNumber,
      locationId: location?.id || pickupCity,
      locationName: location?.name || pickupCity,
      customerName,
      serviceType: 'packers',
      serviceDisplayName: 'Packers & Movers',
    }).catch((err: any) => console.error('[Notification] Failed:', err));

    return NextResponse.json({
      success: true,
      message: 'Quote request submitted. Vendors will send quotes within 24-48 hours.',
      quoteRequest: {
        id: quoteRequest.id,
        requestNumber: quoteRequest.requestNumber,
        status: quoteRequest.status,
        shiftingType: quoteRequest.shiftingType,
        pickupCity: quoteRequest.pickupCity,
        pickupAddress: quoteRequest.pickupAddress,
        dropCity: quoteRequest.dropCity,
        dropAddress: quoteRequest.dropAddress,
        preferredDate: quoteRequest.preferredDate,
        expiresAt: quoteRequest.expiresAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to create packers quote request', error);
    return NextResponse.json({ error: 'Failed to create quote request', details: error?.message }, { status: 500 });
  }
}

// GET - List Packers Quote Requests for a customer
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

    const requests = await prisma.packers_quote_requests.findMany({
      where: whereClause,
      include: {
        packers_quotes: {
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
        shiftingType: r.shiftingType,
        propertySize: r.propertySize,
        pickupCity: r.pickupCity,
        pickupAddress: r.pickupAddress,
        dropCity: r.dropCity,
        dropAddress: r.dropAddress,
        preferredDate: r.preferredDate,
        status: r.status,
        totalQuotesReceived: r.totalQuotesReceived,
        quotes: r.packers_quotes,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
        // ── Newly-added packers fields (subset most useful for list views) ──
        shiftingScope: r.shiftingScope,
        pickupPincode: r.pickupPincode,
        dropPincode: r.dropPincode,
        estimatedWeight: r.estimatedWeight,
        estimatedVolumeCubFt: r.estimatedVolumeCubFt,
        boxesCount: r.boxesCount,
        bagsCount: r.bagsCount,
        vehicleType: r.vehicleType,
        labourCount: r.labourCount,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch packers quote requests', error);
    return NextResponse.json({ error: 'Failed to fetch requests', details: error?.message }, { status: 500 });
  }
}
