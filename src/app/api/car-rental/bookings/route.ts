import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SignJWT } from 'jose';
import logger from '@/lib/security/logger';
import { generateCustomerId } from '@/lib/utils/id-generator';
import { sanitizeInput, isValidEmail, isValidPhone, sanitizePhone } from '@/lib/utils/sanitize';
import { smartRateLimit, detectDuplicate, getClientIdentifier, hashBookingData } from '@/lib/utils/smart-rate-limit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

// JWT secret for customer auth
const JWT_SECRET = new TextEncoder().encode(
  process.env.CUSTOMER_JWT_SECRET || process.env.JWT_SECRET || 'customer-secret-key-change-in-production'
);

// Generate a human-readable booking number
function generateBookingNumber(): string {
  const prefix = 'CR'; // CR for Car Rental
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

// Generate OTP
function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Map trip type from form to enum
function mapTripType(tripType: string, mode?: string, airportMode?: string): string {
  if (tripType === 'local') return 'LOCAL';
  if (tripType === 'outstation') {
    return mode === 'one-way' ? 'OUTSTATION_ONEWAY' : 'OUTSTATION_ROUNDTRIP';
  }
  if (tripType === 'airport') {
    return airportMode === 'pickup' ? 'AIRPORT_PICKUP' : 'AIRPORT_DROP';
  }
  return 'LOCAL';
}

// POST - Create new car rental booking
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
          success: false,
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
          success: false,
          error: duplicateCheck.error,
          type: 'duplicate_booking',
        },
        { status: 400 }
      );
    }

    let {
      tripType,
      carCategory,
      carCategoryName,
      pickupCity,
      pickupLocationId,
      dropCity,
      dropLocationId,
      pickupAddress,
      dropAddress,
      pickupDate,
      pickupTime,
      returnDate,
      localPackageId,
      localPackageHours,
      localPackageKm,
      mode,
      airportMode,
      customerName,
      customerPhone,
      customerEmail,
      customerNotes,
      baseFare,
      gstAmount,
      platformFee,
      grandTotal,
      advancePaid,
      transactionId,
      paymentMethod,
    } = body;

    // ===== INPUT SANITIZATION (XSS Protection) =====
    customerName = sanitizeInput(customerName);
    pickupCity = sanitizeInput(pickupCity);
    dropCity = sanitizeInput(dropCity);
    pickupAddress = sanitizeInput(pickupAddress);
    dropAddress = sanitizeInput(dropAddress);
    customerNotes = sanitizeInput(customerNotes);
    carCategoryName = sanitizeInput(carCategoryName);
    customerPhone = sanitizePhone(customerPhone);

    // Validate required fields
    if (!customerName || !customerPhone || !customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Customer details are required' },
        { status: 400 }
      );
    }

    // ===== EMAIL & PHONE VALIDATION =====
    if (customerEmail && !isValidEmail(customerEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (customerPhone && !isValidPhone(customerPhone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number. Must be 10 digits starting with 6-9' },
        { status: 400 }
      );
    }

    if (!pickupCity || !pickupDate || !pickupTime) {
      return NextResponse.json(
        { success: false, error: 'Pickup details are required' },
        { status: 400 }
      );
    }

    // ===== DATE VALIDATION =====
    if (pickupDate) {
      const pickup = new Date(pickupDate);
      if (isNaN(pickup.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid pickup date format. Please provide a valid date.' },
          { status: 400 }
        );
      }

      // For outstation roundtrip, validate return date
      if (returnDate && (tripType === 'outstation' || mode === 'roundtrip')) {
        const returnD = new Date(returnDate);
        if (isNaN(returnD.getTime())) {
          return NextResponse.json(
            { success: false, error: 'Invalid return date format. Please provide a valid date.' },
            { status: 400 }
          );
        }

        if (returnD < pickup) {
          return NextResponse.json(
            { success: false, error: 'Return date cannot be before pickup date' },
            { status: 400 }
          );
        }
      }
    }

    if (!carCategory && !carCategoryName) {
      return NextResponse.json(
        { success: false, error: 'Car category is required' },
        { status: 400 }
      );
    }

    // Find the location by name, slug, or ID
    let location = null;

    // First try by ID if provided
    if (pickupLocationId) {
      location = await prisma.locations.findUnique({
        where: { id: pickupLocationId },
      });
    }

    // Try by slug (city name converted to slug)
    if (!location) {
      const citySlug = pickupCity.toLowerCase().replace(/\s+/g, '-');
      // Try exact slug match first
      location = await prisma.locations.findFirst({
        where: { slug: citySlug },
      });

      // Try name match if slug didn't work
      if (!location) {
        location = await prisma.locations.findFirst({
          where: { name: pickupCity },
        });
      }
    }

    // If still no location found, return error
    if (!location) {
      return NextResponse.json(
        {
          success: false,
          error: `Location "${pickupCity}" not found. Please select a valid city.`,
        },
        { status: 400 }
      );
    }

    const locationId = location.id;
    const locationName = location.name;

    // Calculate days for outstation
    let totalDays = 1;
    if (tripType === 'outstation' && returnDate) {
      const start = new Date(pickupDate);
      const end = new Date(returnDate);
      totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    }

    // Map trip type to enum value
    const mappedTripType = mapTripType(tripType, mode, airportMode);

    // Generate booking number
    const bookingNumber = generateBookingNumber();

    // Note: OTP will be generated when driver starts the trip, not at booking time

    // Build the booking data
    const bookingData: any = {
      bookingNumber,

      // Customer
      customerName,
      customerEmail,
      customerPhone,

      // Location (required)
      locationId,
      locationName,

      // Trip Type
      tripType: mappedTripType,

      // Locations
      pickupCity,
      dropCity: dropCity || pickupCity,
      pickupAddress: pickupAddress || null,
      dropAddress: dropAddress || null,

      // Car
      carCategory: carCategory || 'car',
      carCategoryName: carCategoryName || 'Car',

      // Dates
      pickupDate: new Date(pickupDate),
      pickupTime,
      returnDate: returnDate ? new Date(returnDate) : null,
      totalDays,

      // Pricing
      baseFare: baseFare || 0,
      perKmRate: 0, // Pre-calculated in frontend
      gstAmount: gstAmount || 0,
      platformFee: platformFee || 99,
      grandTotal: grandTotal || 0,

      // Payment
      paymentStatus: advancePaid > 0 ? 'PARTIAL' : 'PENDING',
      paidAmount: advancePaid || 0,
      paymentMethod: paymentMethod || null,
      transactionId: transactionId || null,

      // Status
      status: 'PENDING_PAYMENT',

      // OTP - will be generated when driver starts the trip
      tripStartOtp: null,

      // Notes
      customerNotes: customerNotes || null,
    };

    // Add local package details if applicable
    if (tripType === 'local') {
      bookingData.localPackageId = localPackageId || null;
      bookingData.localPackageHours = localPackageHours || null;
      bookingData.localPackageKm = localPackageKm || null;
      bookingData.totalHours = localPackageHours || null;
    }

    // Create booking
    const booking = await prisma.chauffeur_bookings.create({
      data: {
        ...bookingData,
      },
    });

    // Auto-register customer if not exists
    let customer = await prisma.customers.findFirst({
      where: {
        OR: [
          { email: customerEmail.toLowerCase() },
          { phone: customerPhone },
        ],
      },
    });

    if (!customer) {
      // Create new customer (without password - they can set it later)
      const customerId = await generateCustomerId();
      customer = await prisma.customers.create({
        data: {
          id: customerId,
          name: customerName,
          email: customerEmail.toLowerCase(),
          phone: customerPhone,
          isEmailVerified: true, // Auto-verify since they made a booking
          isPhoneVerified: true,
        },
      });
    }

    // Link booking to customer
    await prisma.chauffeur_bookings.update({
      where: { id: booking.id },
      data: { customerId: customer.id },
    });

    // Generate JWT token for auto-login
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
      message: 'Booking created successfully. Please complete payment to confirm.',
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        grandTotal: booking.grandTotal,
        status: booking.status,
      },
      // Auto-login data
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      token,
      // Redirect to payment page
      redirect_to: `/pay/${booking.bookingNumber}`,
    });
  } catch (error: any) {
    logger.error('Failed to create car rental booking', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create booking',
        details: error?.message,
        code: error?.code
      },
      { status: 500 }
    );
  }
}

// GET - List car rental bookings (for customer)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerPhone = searchParams.get('phone');
    const customerEmail = searchParams.get('email');
    const bookingNumber = searchParams.get('bookingNumber');
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {};

    if (bookingNumber) {
      where.bookingNumber = bookingNumber;
    } else if (customerPhone) {
      where.customerPhone = customerPhone;
    } else if (customerEmail) {
      where.customerEmail = customerEmail;
    }

    // Only add status filter if it's not "all" (case insensitive)
    if (status && status.toLowerCase() !== 'all') {
      where.status = status;
    }

    const bookings = await prisma.chauffeur_bookings.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        tripType: b.tripType,
        carCategory: b.carCategory,
        carCategoryName: b.carCategoryName,
        pickupCity: b.pickupCity,
        dropCity: b.dropCity,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        returnDate: b.returnDate,
        localPackageId: b.localPackageId,
        grandTotal: b.grandTotal,
        status: b.status,
        paymentStatus: b.paymentStatus,
        driverName: b.driverName,
        driverPhone: b.driverPhone,
        vehicleNumber: b.vehicleNumber,
        vehicle_models: b.vehicle_models,
        createdAt: b.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch car rental bookings', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
