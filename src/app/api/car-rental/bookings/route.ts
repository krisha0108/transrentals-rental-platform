import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SignJWT } from 'jose';
import logger from '@/lib/security/logger';
import { generateCustomerId } from '@/lib/utils/id-generator';
import { sanitizeInput, isValidEmail, isValidPhone, sanitizePhone } from '@/lib/utils/sanitize';
import { smartRateLimit, detectDuplicate, getClientIdentifier, hashBookingData } from '@/lib/utils/smart-rate-limit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { createB2BBookingSafe } from '@/lib/b2b/booking-number';

export const dynamic = 'force-dynamic';

const JWT_SECRET = new TextEncoder().encode(
  process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET || 'customer-secret-key-change-in-production'
);

function generateBookingNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CB-${year}-${random}`;
}

// POST - Create new car rental booking (with driver) → saves to chauffeur_bookings
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
        { success: false, error: rateLimitCheck.error, requiresCaptcha: rateLimitCheck.requiresCaptcha, type: 'rate_limit' },
        { status: 429 }
      );
    }

    const bookingHash = hashBookingData(body);
    const duplicateCheck = await detectDuplicate(bookingHash);
    if (duplicateCheck.isDuplicate) {
      return NextResponse.json(
        { success: false, error: duplicateCheck.error, type: 'duplicate_booking' },
        { status: 400 }
      );
    }

    let {
      customerName,
      customerPhone,
      customerEmail,
      customerNotes,
      pickupCity,
      pickupLocationId,
      pickupAddress,
      dropAddress,
      dropCity,
      tripType,
      carCategory,
      carCategoryName,
      pickupDate,
      pickupTime,
      dropDate,
      dropTime,
      returnDate,
      returnTime,
      localPackageId,
      localPackageHours,
      localPackageKm,
      baseFare,
      perKmRate,
      chargeableKm,
      kmCharges,
      driverBatta,
      nightCharges,
      gstAmount,
      platformFee,
      grandTotal,
      advancePaid,
      transactionId,
      paymentMethod,
      intermediateStops,
      airportName,
      airport,           // modal sends airportName as 'airport'
      airportMode,
      outstationMode,
      mode,              // modal sends outstationMode as 'mode'
      numberOfVehicles,
      numberOfEmployees,
      // Travel-agent fields (forwarded from the booking page when the customer
      // is linked to a travel agent — see customers.linkedTravelAgentId).
      taBookingMode,    // 'PERSONAL' | 'COMPANY'
    } = body;

    // modal sends outstationMode as 'mode' and airportName as 'airport'
    if (!outstationMode && mode) outstationMode = mode;
    if (!airportName && airport) airportName = airport;

    // Normalise
    carCategoryName = carCategoryName || carCategory || 'Car';
    carCategory     = carCategory || carCategoryName || 'car';
    baseFare        = baseFare || 0;
    perKmRate       = perKmRate || 0;
    gstAmount       = gstAmount || 0;
    grandTotal      = grandTotal || 0;

    // returnDate fallback
    if (!returnDate && dropDate) returnDate = dropDate;

    // tripType normalisation
    if (!tripType || tripType === 'local') tripType = 'LOCAL';
    else if (tripType === 'outstation') tripType = outstationMode === 'round-trip' ? 'OUTSTATION_ROUNDTRIP' : 'OUTSTATION_ONEWAY';
    else if (tripType === 'airport') tripType = airportMode === 'pickup' ? 'AIRPORT_PICKUP' : 'AIRPORT_DROP';
    else if (tripType === 'OUTSTATION_ONE_WAY') tripType = 'OUTSTATION_ONEWAY';
    else if (tripType === 'OUTSTATION_ROUND') tripType = 'OUTSTATION_ROUNDTRIP';
    else tripType = tripType.toUpperCase();

    // ===== TRAVEL-AGENT PLACEHOLDER PHONE =====
    // Detect `ta-<agentId>` BEFORE input sanitization (sanitizePhone strips
    // non-digits, which would mangle the placeholder past recognition).
    let isTaPlaceholderPhone = false;
    if (typeof customerPhone === 'string' && customerPhone.startsWith('ta-')) {
      isTaPlaceholderPhone = true;
      try {
        const agentId = customerPhone.slice(3);
        const ag: any = await (prisma as any).travel_agents.findUnique({ where: { id: agentId } });
        if (ag?.phone) {
          customerPhone = ag.phone; // swap to real phone — sanitization below will keep digits
          isTaPlaceholderPhone = false;
        }
      } catch { /* keep placeholder, skip validation */ }
    }

    // ===== INPUT SANITIZATION =====
    customerName    = sanitizeInput(customerName);
    pickupCity      = sanitizeInput(pickupCity);
    pickupAddress   = sanitizeInput(pickupAddress);
    dropAddress     = sanitizeInput(dropAddress);
    customerNotes   = sanitizeInput(customerNotes);
    if (!isTaPlaceholderPhone) {
      customerPhone = sanitizePhone(customerPhone);
    }
    carCategoryName = sanitizeInput(carCategoryName);

    // ===== VALIDATION =====
    if (!customerName || !customerPhone || !customerEmail) {
      return NextResponse.json({ success: false, error: 'Customer details are required' }, { status: 400 });
    }
    if (!isValidEmail(customerEmail)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }
    if (!isTaPlaceholderPhone && !isValidPhone(customerPhone)) {
      return NextResponse.json({ success: false, error: 'Invalid phone number. Must be 10 digits starting with 6-9' }, { status: 400 });
    }
    if (!pickupCity || !pickupDate || !pickupTime) {
      return NextResponse.json({ success: false, error: 'Pickup city, date and time are required' }, { status: 400 });
    }

    const pickup = new Date(pickupDate);
    if (isNaN(pickup.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid pickup date' }, { status: 400 });
    }

    // ===== LOCATION LOOKUP =====
    let location: any = null;
    if (pickupLocationId) {
      location = await prisma.locations.findUnique({ where: { id: pickupLocationId } });
    }
    if (!location) {
      const slug = pickupCity.toLowerCase().replace(/\s+/g, '-');
      location = await prisma.locations.findFirst({ where: { slug } });
    }
    if (!location) {
      location = await prisma.locations.findFirst({ where: { name: { contains: pickupCity } } });
    }
    if (!location) {
      return NextResponse.json(
        { success: false, error: `Location "${pickupCity}" not found. Please select a valid city.` },
        { status: 400 }
      );
    }

    // ===== DAYS CALCULATION =====
    const ret = returnDate ? new Date(returnDate) : pickup;
    const msPerDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.max(1, Math.ceil((ret.getTime() - pickup.getTime()) / msPerDay));

    // ===== CUSTOMER LOOKUP / CREATE =====
    let customer = await prisma.customers.findFirst({
      where: { OR: [{ email: customerEmail.toLowerCase() }, { phone: customerPhone }] },
    });
    if (!customer) {
      const customerId = await generateCustomerId();
      customer = await prisma.customers.create({
        data: {
          id: customerId,
          name: customerName,
          email: customerEmail.toLowerCase(),
          phone: customerPhone,
          isEmailVerified: true,
          isPhoneVerified: true,
        },
      });
    }

    // ===== TRAVEL AGENT FLOW =====
    // Only COMPANY-mode travel-agent bookings route into the shared
    // b2b_bookings manager queue (no upfront payment). PERSONAL-mode bookings
    // follow the normal customer flow with the regular payment dialog — for
    // travel agents this means they pay just like any other customer for
    // their own personal trips.
    const linkedTaRows: any[] = await (prisma as any).$queryRawUnsafe(
      `SELECT linkedTravelAgentId FROM customers WHERE id = ? LIMIT 1`,
      customer.id,
    );
    const linkedTravelAgentId: string | null = linkedTaRows[0]?.linkedTravelAgentId || null;
    const taMode: 'COMPANY' | null =
      linkedTravelAgentId && taBookingMode === 'COMPANY' ? 'COMPANY' : null;

    if (taMode) {
      const vehiclesReq =
        numberOfVehicles && parseInt(numberOfVehicles) > 0
          ? parseInt(numberOfVehicles)
          : 1;

      // Fetch agent for companyName/agencyName + real phone (for the b2b row)
      const agentRows: any[] = await (prisma as any).$queryRawUnsafe(
        `SELECT agencyName, ownerName, phone FROM travel_agents WHERE id = ? LIMIT 1`,
        linkedTravelAgentId,
      );
      const agencyName = agentRows[0]?.agencyName || customer.name;
      // Prefer the agent's real phone over the shadow customer's `ta-<id>` placeholder.
      const agentPhone: string | null = agentRows[0]?.phone || null;
      let resolvedCustomerPhone: string = customer.phone;
      if (
        agentPhone &&
        (typeof resolvedCustomerPhone !== 'string' || resolvedCustomerPhone.startsWith('ta-'))
      ) {
        resolvedCustomerPhone = agentPhone;
      }

      const taBooking = await createB2BBookingSafe('TA-CO', {
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: resolvedCustomerPhone,
        companyName: agencyName,
        serviceType: 'car',
        vehiclesRequired: vehiclesReq,
        passengerCount: numberOfEmployees ? parseInt(numberOfEmployees) : null,
        vehicleCategory: carCategoryName || null,
        pickupLocation: pickupCity,
        dropLocation: dropCity || null,
        tripType: tripType,
        scheduledDate: pickup,
        scheduledTime: pickupTime,
        returnDate: ret,
        returnTime: returnTime || null,
        specialNotes: customerNotes || null,
        status: 'OPEN_FOR_QUOTES',
        travelAgentId: linkedTravelAgentId,
        bookingMode: taMode,
      });

      const token = await new SignJWT({
        customerId: customer.id,
        email: customer.email,
        phone: customer.phone,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(JWT_SECRET);

      return NextResponse.json({
        success: true,
        message: 'Company booking request sent to manager. You will receive a quote shortly.',
        booking: {
          id: taBooking.id,
          bookingNumber: taBooking.bookingNumber,
          status: taBooking.status,
        },
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
        token,
        isTravelAgent: true,
        bookingMode: taMode,
        redirect_to: `/customer/b2b-bookings/${taBooking.id}?customer_id=${customer.id}`,
      });
    }

    // ===== B2B FLOW =====
    const isB2B = customer.isB2B && customer.b2bStatus === 'APPROVED';
    if (isB2B && numberOfVehicles && parseInt(numberOfVehicles) > 0) {
      const b2bBookingNumber = `B2B-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
      const b2bBooking = await prisma.b2b_bookings.create({
        data: {
          bookingNumber: b2bBookingNumber,
          customerId: customer.id,
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone,
          companyName: customer.companyName || customer.name,
          serviceType: 'car',
          vehiclesRequired: parseInt(numberOfVehicles),
          passengerCount: numberOfEmployees ? parseInt(numberOfEmployees) : null,
          vehicleCategory: carCategoryName || null,
          pickupLocation: pickupCity,
          scheduledDate: pickup,
          scheduledTime: pickupTime,
          returnDate: ret,
          specialNotes: customerNotes || null,
          status: 'OPEN_FOR_QUOTES',
        },
      });

      const token = await new SignJWT({ customerId: customer.id, email: customer.email, phone: customer.phone })
        .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30d').sign(JWT_SECRET);

      return NextResponse.json({
        success: true,
        message: 'B2B Booking created. Vendors will send quotes.',
        booking: { id: b2bBooking.id, bookingNumber: b2bBooking.bookingNumber, status: b2bBooking.status },
        customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
        token, isB2B: true,
        redirect_to: `/customer/b2b-bookings/${b2bBooking.id}?customer_id=${customer.id}`,
      });
    }

    // ===== NORMAL FLOW: chauffeur_bookings =====
    // If the resolved customer is linked to a travel agent, tag this row as
    // PERSONAL TA booking. We don't depend on the front-end sending
    // `taBookingMode` — the customer→agent link in the DB is the source
    // of truth.
    const isTaPersonal = !!linkedTravelAgentId;
    const bookingNumber = generateBookingNumber();

    const booking = await (prisma as any).chauffeur_bookings.create({
      data: {
        bookingNumber,
        customerId:          customer.id,
        customerName,
        customerEmail:       customerEmail.toLowerCase(),
        customerPhone,
        locationId:          location.id,
        locationName:        location.name,
        tripType:            tripType as any,
        carCategory:         String(carCategory),
        carCategoryName:     carCategoryName || 'Car',
        pickupCity,
        dropCity:            dropCity || null,
        pickupAddress:       pickupAddress || pickupCity,
        dropAddress:         dropAddress || null,
        pickupDate:          pickup,
        pickupTime,
        returnDate:          returnDate ? new Date(returnDate) : null,
        returnTime:          returnTime || null,
        totalDays,
        localPackageId:      localPackageId || null,
        localPackageHours:   localPackageHours ? parseInt(localPackageHours) : null,
        localPackageKm:      localPackageKm   ? parseInt(localPackageKm)   : null,
        intermediateStops:   intermediateStops ? JSON.stringify(intermediateStops) : null,
        airportName:         airportName || null,
        baseFare:            baseFare,
        perKmRate:           perKmRate || 0,
        chargeableKm:        chargeableKm ? parseInt(chargeableKm) : null,
        kmCharges:           kmCharges || 0,
        driverBatta:         driverBatta || 0,
        // Pricing already folds the night charge into grandTotal; store it too so
        // the fare breakdown adds up instead of showing a silent gap.
        nightCharges:        nightCharges || 0,
        gstAmount,
        platformFee:         platformFee || 99,
        grandTotal,
        paidAmount:          advancePaid || 0,
        paymentMethod:       paymentMethod || null,
        transactionId:       transactionId || null,
        paymentStatus:       advancePaid > 0 ? 'SUBMITTED' : 'PENDING',
        status:              'PENDING_PAYMENT',
        customerNotes:       customerNotes || null,
        source:              body.source || 'web',
      },
    });

    // Tag with TA fields via raw SQL — bypasses any Prisma-client cache
    // issues with the new columns (more reliable than the create-time spread).
    if (isTaPersonal) {
      try {
        await (prisma as any).$executeRawUnsafe(
          `UPDATE chauffeur_bookings SET travelAgentId = ?, bookingMode = ? WHERE id = ?`,
          linkedTravelAgentId,
          'PERSONAL',
          booking.id,
        );
        // Patch customerPhone if it's a `ta-<id>` placeholder — replace with
        // the agent's real phone so downstream reports/displays look clean.
        try {
          const ag: any = await (prisma as any).travel_agents.findUnique({
            where: { id: linkedTravelAgentId! },
            select: { phone: true },
          });
          if (ag?.phone) {
            await (prisma as any).$executeRawUnsafe(
              `UPDATE chauffeur_bookings SET customerPhone = ? WHERE id = ? AND customerPhone LIKE 'ta-%'`,
              ag.phone,
              booking.id,
            );
          }
        } catch { /* non-fatal */ }
        console.log('[car-rental/bookings] TA tag applied', {
          id: booking.id,
          travelAgentId: linkedTravelAgentId,
        });
      } catch (e) {
        console.error('[car-rental/bookings] TA tag UPDATE failed', e);
      }
    }

    const token = await new SignJWT({ customerId: customer.id, email: customer.email, phone: customer.phone })
      .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('30d').sign(JWT_SECRET);

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully. Please complete payment to confirm.',
      booking: { id: booking.id, bookingNumber: booking.bookingNumber, grandTotal: booking.grandTotal, status: booking.status },
      customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
      token, isB2B: false,
      redirect_to: `/pay/${booking.bookingNumber}`,
    });
  } catch (error: any) {
    logger.error('Failed to create car rental booking', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking', details: error?.message, code: error?.code },
      { status: 500 }
    );
  }
}

// GET - List car rental bookings for customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerPhone = searchParams.get('phone');
    const customerEmail = searchParams.get('email');
    const bookingNumber = searchParams.get('bookingNumber');
    const status        = searchParams.get('status');

    const where: any = {};
    if (bookingNumber)    where.bookingNumber  = bookingNumber;
    else if (customerPhone) where.customerPhone = customerPhone;
    else if (customerEmail) where.customerEmail = customerEmail;

    if (status && status.toLowerCase() !== 'all') where.status = status;

    const bookings = await prisma.chauffeur_bookings.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      bookings: bookings.map(b => ({
        id:              b.id,
        bookingNumber:   b.bookingNumber,
        carCategoryName: b.carCategoryName,
        carCategory:     b.carCategory,
        pickupCity:      b.pickupCity,
        dropCity:        b.dropCity,
        pickupDate:      b.pickupDate,
        pickupTime:      b.pickupTime,
        returnDate:      b.returnDate,
        totalDays:       b.totalDays,
        grandTotal:      b.grandTotal,
        status:          b.status,
        paymentStatus:   b.paymentStatus,
        createdAt:       b.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch car rental bookings', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
