// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';
import { sanitizeInput, isValidEmail, isValidPhone, sanitizePhone } from '@/lib/utils/sanitize';
import { smartRateLimit, detectDuplicate, getClientIdentifier, hashBookingData } from '@/lib/utils/smart-rate-limit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

function generateBookingNumber(): string {
  const prefix = 'LB';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// POST - Customer creates a Luxury Car Booking (Broadcasted to vendors)
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
      vehicle_category, vehiclePreference, specificVehicle,
      serviceType, tripType, withChauffeur,
      pickupCity, pickupAddress, pickupLandmark,
      dropCity, dropAddress, dropLandmark,
      pickupDate, pickupTime, returnDate, returnTime,
      estimatedKm, estimatedDays,
      needAirportPickup, flightNumber, terminalNumber,
      needDecoration, decorationType, needPhotographer,
      specialRequests, occasionType,
      budgetMin, budgetMax,
    } = body;

    // ===== INPUT SANITIZATION (XSS Protection) =====
    customerName = sanitizeInput(customerName);
    vehiclePreference = sanitizeInput(vehiclePreference);
    specificVehicle = sanitizeInput(specificVehicle);
    pickupCity = sanitizeInput(pickupCity);
    pickupAddress = sanitizeInput(pickupAddress);
    pickupLandmark = sanitizeInput(pickupLandmark);
    dropCity = sanitizeInput(dropCity);
    dropAddress = sanitizeInput(dropAddress);
    dropLandmark = sanitizeInput(dropLandmark);
    specialRequests = sanitizeInput(specialRequests);
    flightNumber = sanitizeInput(flightNumber);
    decorationType = sanitizeInput(decorationType);
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

    if (!vehicle_category || !pickupCity || !pickupAddress || !pickupDate || !pickupTime) {
      return NextResponse.json({ error: 'Vehicle and pickup details are required' }, { status: 400 });
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

    // MySQL is case-insensitive by default with utf8mb4 collation
    const location = await prisma.locations.findFirst({
      where: {
        OR: [
          { name: { contains: pickupCity } },
          { slug: pickupCity.toLowerCase().replace(/\s+/g, '-') },
        ],
        isActive: true,
      },
    });

    const bookingNumber = generateBookingNumber();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 4); // Broadcast expires in 4 hours

    const booking = await prisma.luxury_bookings.create({
      data: {
        bookingNumber,
        customerName,
        customerEmail,
        customerPhone,
        // Customer relation (optional)
        ...(customerId ? { customers: { connect: { id: customerId } } } : {}),
        // Location relation (optional)
        ...(location?.id ? { locations: { connect: { id: location.id } } } : {}),
        locationName: location?.name || pickupCity,
        // Trip Details
        tripType: tripType || 'hourly',
        eventType: serviceType || null,
        occasion: occasionType || null,
        // Vehicle Preference
        carCategory: vehicle_category || 'luxury-sedan',
        carCategoryName: vehicle_category || 'Luxury Sedan',
        preferredBrands: vehiclePreference ? JSON.stringify([vehiclePreference.split(' ')[0]]) : null,
        preferredModels: vehiclePreference ? JSON.stringify([vehiclePreference]) : null,
        // Route
        pickupCity,
        pickupAddress: pickupAddress || null,
        dropCity: dropCity || null,
        dropAddress: dropAddress || null,
        venueName: null,
        // Schedule
        pickupDate: new Date(pickupDate),
        pickupTime,
        returnDate: returnDate ? new Date(returnDate) : null,
        returnTime: returnTime || null,
        totalHours: null,
        totalDays: estimatedDays || 1,
        // Requirements
        needDecoration: needDecoration || false,
        decorationType: decorationType || null,
        needChauffeur: withChauffeur !== false,
        chauffeurAttire: null,
        customerNotes: specialRequests || null,
        // Pricing - Set to 0 for quote-based booking (vendor will quote)
        baseFare: 0,
        decorationCharges: 0,
        chauffeurCharges: 0,
        extraHourRate: null,
        gstAmount: 0,
        platformFee: 0,
        grandTotal: 0,
        // Status
        status: 'BROADCASTED',
        responseDeadline: expiresAt,
        tripStartOtp: generateOTP(),
        tripEndOtp: generateOTP(),
        // Source tracking
        source: body.source || 'web',
      },
    });

    // Travel-agent PERSONAL tagging
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
            `UPDATE luxury_bookings SET travelAgentId = ?, bookingMode = ? WHERE id = ?`,
            agentId, 'PERSONAL', booking.id,
          );
        }
      }
    } catch (e) { console.error('[luxury-bookings] TA tag failed', e); }

    return NextResponse.json({
      success: true,
      message: 'Luxury car booking request broadcasted to vendors. You will receive confirmations shortly.',
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        chauffeur_vehicle_categories: booking.vehicle_category,
        pickupCity: booking.pickupCity,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        broadcastExpiresAt: booking.broadcastExpiresAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to create luxury booking', error);
    return NextResponse.json({ error: 'Failed to create booking', details: error?.message }, { status: 500 });
  }
}

// GET - List Luxury Bookings for a customer
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

    const bookings = await prisma.luxury_bookings.findMany({
      where: whereClause,
      include: {
        vendors_luxury_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, rating: true } },
        vendors_luxury_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, rating: true } },
        luxury_quotes: {
          select: {
            id: true,
            quoteNumber: true,
            totalAmount: true,
            vehicleName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      bookings: bookings.map((b) => {
        const vendor = b.vendors_luxury_bookings_acceptedVendorIdTovendors || b.vendors_luxury_bookings_assignedVendorIdTovendors;
        return {
          id: b.id,
          bookingNumber: b.bookingNumber,
          chauffeur_vehicle_categories: b.vehicle_category,
          vehiclePreference: b.vehiclePreference,
          assignedVehicle: b.assignedVehicle,
          serviceType: b.serviceType,
          tripType: b.tripType,
          pickupCity: b.pickupCity,
          dropCity: b.dropCity,
          pickupDate: b.pickupDate,
          pickupTime: b.pickupTime,
          returnDate: b.returnDate,
          totalAmount: b.totalAmount,
          advanceAmount: b.advanceAmount,
          status: b.status,
          paymentStatus: b.paymentStatus,
          chauffeurName: b.chauffeurName,
          chauffeurPhone: b.chauffeurPhone,
          rating: b.rating,
          vendor: vendor ? { name: vendor.businessName, phone: vendor.phone, rating: vendor.rating } : null,
          quote: b.luxury_quotes || null,
          broadcastExpiresAt: b.broadcastExpiresAt,
          createdAt: b.createdAt,
        };
      }),
    });
  } catch (error: any) {
    logger.error('Failed to fetch luxury bookings', error);
    return NextResponse.json({ error: 'Failed to fetch bookings', details: error?.message }, { status: 500 });
  }
}
