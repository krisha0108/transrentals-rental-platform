// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';
import { sanitizeInput, isValidEmail, isValidPhone, sanitizePhone } from '@/lib/utils/sanitize';
import { smartRateLimit, detectDuplicate, getClientIdentifier, hashBookingData } from '@/lib/utils/smart-rate-limit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { sendQuoteRequestNotificationToVendors } from '@/lib/utils/vendor-notification-sender';
import crypto from 'crypto';

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

function generateB2BId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

function generateB2BBookingNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `B2B-${year}-${random}`;
}

// POST - Customer creates a Bus Quote Request
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

      // B2B fields
      isB2B,
      numberOfVehicles,
      numberOfPersons,
      // Travel-agent fields
      taBookingMode,    // 'PERSONAL' | 'COMPANY'
    } = body;

    // ===== INPUT SANITIZATION (XSS Protection) =====
    customerName = sanitizeInput(customerName);
    vehicleCategoryName = sanitizeInput(vehicleCategoryName);
    pickupCity = sanitizeInput(pickupCity);
    pickupAddress = sanitizeInput(pickupAddress);
    dropCity = sanitizeInput(dropCity);
    dropAddress = sanitizeInput(dropAddress);
    routeDetails = sanitizeInput(routeDetails);
    requirements = sanitizeInput(requirements);
    customerPhone = sanitizePhone(customerPhone);

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone) {
      logger.error('Missing customer details', { customerName, customerEmail, customerPhone });
      return NextResponse.json(
        { error: 'Customer details are required' },
        { status: 400 }
      );
    }

    // ===== EMAIL & PHONE VALIDATION =====
    if (customerEmail && !isValidEmail(customerEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (customerPhone && !isValidPhone(customerPhone)) {
      return NextResponse.json({ error: 'Invalid phone number. Must be 10 digits starting with 6-9' }, { status: 400 });
    }

    if (!pickupCity || !pickupDate || !passengers) {
      logger.error('Missing trip details', { pickupCity, pickupDate, passengers });
      return NextResponse.json(
        { error: 'Trip details are required (pickup city, date, and passengers)' },
        { status: 400 }
      );
    }

    // ===== DATE VALIDATION =====
    const pickup = new Date(pickupDate);
    if (isNaN(pickup.getTime())) {
      return NextResponse.json({ error: 'Invalid pickup date format. Please provide a valid date.' }, { status: 400 });
    }

    if (returnDate) {
      const returnD = new Date(returnDate);
      if (isNaN(returnD.getTime())) {
        return NextResponse.json({ error: 'Invalid return date format. Please provide a valid date.' }, { status: 400 });
      }

      if (returnD < pickup) {
        return NextResponse.json({ error: 'Return date cannot be before pickup date' }, { status: 400 });
      }
    }

    // Validate trip type
    if (!tripType || !['local', 'outstation', 'pilgrimage', 'wedding', 'corporate', 'school'].includes(tripType)) {
      logger.error('Invalid trip type', { tripType });
      return NextResponse.json(
        { error: 'Valid trip type is required' },
        { status: 400 }
      );
    }

    // ============ TRAVEL AGENT FLOW ============
    // If the submitting customer is linked to a travel agent and has chosen
    // a TA booking mode, route the request into b2b_bookings for the manager
    // queue. No advance, monthly invoice for company bookings.
    if (taBookingMode === 'PERSONAL' || taBookingMode === 'COMPANY') {
      // Find / resolve the customer
      let taCustomer: any = null;
      if (customerId) {
        taCustomer = await prisma.customers.findUnique({ where: { id: customerId } });
      }
      if (!taCustomer && customerEmail) {
        taCustomer = await prisma.customers.findFirst({
          where: { email: customerEmail.toLowerCase() },
        });
      }
      if (!taCustomer && customerPhone) {
        taCustomer = await prisma.customers.findFirst({ where: { phone: customerPhone } });
      }

      if (taCustomer) {
        const linkedRows: any[] = await (prisma as any).$queryRawUnsafe(
          `SELECT linkedTravelAgentId FROM customers WHERE id = ? LIMIT 1`,
          taCustomer.id,
        );
        const linkedTravelAgentId: string | null =
          linkedRows[0]?.linkedTravelAgentId || null;

        if (linkedTravelAgentId) {
          const vehiclesReq =
            taBookingMode === 'COMPANY' && numberOfVehicles && parseInt(numberOfVehicles) > 0
              ? parseInt(numberOfVehicles)
              : 1;

          const agentRows: any[] = await (prisma as any).$queryRawUnsafe(
            `SELECT agencyName, ownerName FROM travel_agents WHERE id = ? LIMIT 1`,
            linkedTravelAgentId,
          );
          const agencyName = agentRows[0]?.agencyName || taCustomer.name;

          const taBookingId = generateB2BId();
          const taBookingNumber = `TA-${taBookingMode === 'COMPANY' ? 'CO' : 'PR'}-${new Date()
            .getFullYear()}-${Math.floor(Math.random() * 100000)
            .toString()
            .padStart(5, '0')}`;

          const busPreference = {
            vehicleCategoryName: vehicleCategoryName || 'Standard Bus',
            passengers: passengers ? parseInt(String(passengers)) : null,
            needAC: needAC === true || needAC === 'true',
            needLuxury: needLuxury === true || needLuxury === 'true',
            needSleeper: needSleeper === true || needSleeper === 'true',
            requirements: requirements || null,
            routeDetails: routeDetails || null,
          };

          const taBooking = await prisma.b2b_bookings.create({
            data: {
              id: taBookingId,
              bookingNumber: taBookingNumber,
              customerId: taCustomer.id,
              customerName: taCustomer.name,
              customerEmail: taCustomer.email,
              customerPhone: taCustomer.phone,
              companyName: agencyName,
              serviceType: 'bus',
              vehiclesRequired: vehiclesReq,
              passengerCount: passengers ? parseInt(String(passengers)) : null,
              vehicleCategory: vehicleCategoryName || 'Standard Bus',
              pickupLocation: pickupCity ? String(pickupCity).trim() : null,
              dropLocation: dropCity ? String(dropCity).trim() : null,
              tripType: tripType || 'outstation',
              scheduledDate: new Date(pickupDate),
              scheduledTime: pickupTime || '06:00',
              returnDate: returnDate ? new Date(returnDate) : null,
              returnTime: returnTime || null,
              specialNotes: JSON.stringify(busPreference),
              status: 'OPEN_FOR_QUOTES',
            },
          });

          await (prisma as any).$executeRawUnsafe(
            `UPDATE b2b_bookings SET travelAgentId = ?, bookingMode = ? WHERE id = ?`,
            linkedTravelAgentId,
            taBookingMode,
            taBooking.id,
          );

          return NextResponse.json({
            success: true,
            isTravelAgent: true,
            bookingMode: taBookingMode,
            message:
              taBookingMode === 'COMPANY'
                ? 'Company bus booking sent to manager. Quote will be shared shortly.'
                : 'Personal bus booking sent to manager. Quote will be shared shortly.',
            booking: {
              id: taBooking.id,
              bookingNumber: taBooking.bookingNumber,
              status: taBooking.status,
            },
            redirect_to: `/customer/b2b-bookings/${taBooking.id}?customer_id=${taCustomer.id}`,
          });
        }
      }
      // If we couldn't link, fall through to normal quote-request flow
    }

    // ============ B2B FLOW ============
    if (isB2B && customerId) {
      const customer = await prisma.customers.findUnique({
        where: { id: customerId },
        select: { id: true, name: true, email: true, phone: true, companyName: true, isB2B: true, b2bStatus: true },
      });

      if (!customer || !customer.isB2B || customer.b2bStatus !== 'APPROVED') {
        return NextResponse.json({ error: 'B2B access not approved' }, { status: 403 });
      }

      const bookingId = generateB2BId();
      const bookingNumber = generateB2BBookingNumber();

      // Build bus preference JSON for specialNotes
      const busPreference = {
        vehicleCategoryName: vehicleCategoryName || 'Standard Bus',
        passengers: passengers ? parseInt(String(passengers)) : null,
        needAC: needAC === true || needAC === 'true',
        needLuxury: needLuxury === true || needLuxury === 'true',
        needSleeper: needSleeper === true || needSleeper === 'true',
        requirements: requirements || null,
        routeDetails: routeDetails || null,
        stops: stops || null,
      };

      // Calculate trip days
      let calculatedTripDays = tripDays || 1;
      if (returnDate && pickupDate && !tripDays) {
        const diff = new Date(returnDate).getTime() - new Date(pickupDate).getTime();
        calculatedTripDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      const booking = await prisma.b2b_bookings.create({
        data: {
          id: bookingId,
          bookingNumber,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          companyName: customer.companyName || customer.name,
          serviceType: 'bus-rental',
          vehiclesRequired: numberOfVehicles ? parseInt(numberOfVehicles) : 1,
          passengerCount: numberOfPersons ? parseInt(numberOfPersons) : (passengers ? parseInt(String(passengers)) : null),
          vehicleCategory: vehicleCategoryName || 'Standard Bus',
          pickupLocation: pickupCity ? String(pickupCity).trim() : null,
          dropLocation: dropCity ? String(dropCity).trim() : null,
          tripType: tripType || 'outstation',
          scheduledDate: new Date(pickupDate),
          scheduledTime: pickupTime || '06:00',
          returnDate: returnDate ? new Date(returnDate) : null,
          returnTime: returnTime || null,
          specialNotes: JSON.stringify(busPreference),
          status: 'OPEN_FOR_QUOTES',
        },
      });

      return NextResponse.json({
        success: true,
        isB2B: true,
        message: 'B2B bus rental booking created. Vendors will be notified.',
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          status: booking.status,
        },
      });
    }

    // ============ REGULAR FLOW ============
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
          source: body.source || 'web',
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

    // Non-blocking vendor notification
    sendQuoteRequestNotificationToVendors({
      requestId: quoteRequest.id,
      requestNumber: quoteRequest.requestNumber,
      locationId: location?.id || pickupCity,
      locationName: location?.name || pickupCity,
      customerName,
      serviceType: 'bus',
      serviceDisplayName: 'Bus Rental',
    }).catch((err: any) => console.error('[BusRoute] Notification Failed:', err));

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
        bus_quotes_bus_quotes_requestIdTobus_quote_requests: {
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
        quotes: r.bus_quotes_bus_quotes_requestIdTobus_quote_requests,
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
