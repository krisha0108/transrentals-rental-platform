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

// Helper to generate booking number
function generateBookingNumber(): string {
  const prefix = 'CR';
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// Helper to calculate rental days
function calculateDays(pickupDate: Date, dropDate: Date): number {
  const diff = dropDate.getTime() - pickupDate.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(days, 1);
}

// POST - Create a new car booking
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
      // Customer info
      customerName,
      customerEmail,
      customerPhone,
      customerId,

      // Location
      locationId,
      locationName,
      pickupAddress,

      // Vehicle
      vehicleId,
      vehicleName,
      vehicleBrand,
      vehicle_category,
      vehicleType,
      vehicleTransmission,
      vehicleFuelType,
      vehicleSeats,

      // Dates
      pickupDate,
      pickupTime,
      dropDate,
      dropTime,

      // Pricing
      dailyRate,
      kmLimitPerDay = 200,
      extraKmRate = 10,
      securityDeposit = 5000,

      // Extras
      customerNotes,
      licenseNumber,
    } = body;

    // ===== INPUT SANITIZATION (XSS Protection) =====
    customerName = sanitizeInput(customerName);
    vehicleName = sanitizeInput(vehicleName);
    vehicleBrand = sanitizeInput(vehicleBrand);
    customerNotes = sanitizeInput(customerNotes);
    licenseNumber = sanitizeInput(licenseNumber);
    pickupAddress = sanitizeInput(pickupAddress);
    customerPhone = sanitizePhone(customerPhone);

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: 'Customer details are required' },
        { status: 400 }
      );
    }

    // ===== EMAIL & PHONE VALIDATION =====
    if (customerEmail && !isValidEmail(customerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (customerPhone && !isValidPhone(customerPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number. Must be 10 digits starting with 6-9' },
        { status: 400 }
      );
    }

    if (!locationId || !pickupDate || !dropDate) {
      return NextResponse.json(
        { error: 'Location and dates are required' },
        { status: 400 }
      );
    }

    // ===== DATE VALIDATION =====
    const pickup = new Date(pickupDate);
    const drop = new Date(dropDate);

    if (isNaN(pickup.getTime()) || isNaN(drop.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Please provide valid dates.' },
        { status: 400 }
      );
    }

    if (drop < pickup) {
      return NextResponse.json(
        { error: 'Drop date cannot be before pickup date' },
        { status: 400 }
      );
    }

    if (!vehicleName || !dailyRate) {
      return NextResponse.json(
        { error: 'Vehicle and pricing information required' },
        { status: 400 }
      );
    }

    // Calculate rental days
    const totalDays = calculateDays(new Date(pickupDate), new Date(dropDate));

    // Calculate pricing
    const baseAmount = dailyRate * totalDays;
    const gstAmount = Math.round(baseAmount * 0.18);
    const platformFee = 99;
    const grandTotal = baseAmount + gstAmount + platformFee;

    // Calculate advance amount (30% of grand total)
    const advancePercentage = 30;
    const advanceAmount = Math.round(grandTotal * (advancePercentage / 100));

    // Generate booking number
    const bookingNumber = generateBookingNumber();

    // Find vendor who owns this vehicle (for later assignment after payment verification)
    let assignedVendorId = null;
    let notifiedVendorIds: string[] = [];
    if (vehicleId) {
      const vendor_fleet = await prisma.vendor_fleets.findFirst({
        where: {
          id: vehicleId,
          isActive: true,
          isAvailable: true,
        },
        select: { vendorId: true },
      });
      if (vendor_fleet?.vendorId) {
        assignedVendorId = vendor_fleet.vendorId;
        notifiedVendorIds = [vendor_fleet.vendorId];
      }
    }

    // Create the booking with PENDING_PAYMENT status
    // Admin will verify payment before routing to vendor
    const booking = await prisma.car_bookings.create({
      data: {
        bookingNumber,
        customerId: customerId || null,
        customerName,
        customerEmail,
        customerPhone,
        locationId,
        locationName: locationName || '',
        pickupAddress,
        requestedVehicleId: vehicleId,
        requestedVehicleName: vehicleName,
        requestedBrand: vehicleBrand,
        requestedCategory: vehicle_category,
        requestedVehicleType: vehicleType,
        requestedTransmission: vehicleTransmission,
        requestedFuelType: vehicleFuelType,
        requestedSeats: vehicleSeats,
        pickupDate: new Date(pickupDate),
        pickupTime,
        dropDate: new Date(dropDate),
        dropTime,
        totalDays,
        dailyRate,
        baseAmount,
        gstAmount,
        platformFee,
        securityDeposit,
        grandTotal,
        advanceAmount,
        advancePercentage,
        kmLimitPerDay,
        extraKmRate,
        customerNotes,
        licenseNumber,
        // Store vendor info for later assignment after payment verification
        assignedVendorId,
        notifiedVendorIds: notifiedVendorIds.length > 0 ? JSON.stringify(notifiedVendorIds) : null,
        // Status is PENDING_PAYMENT - customer needs to submit payment first
        status: 'PENDING_PAYMENT',
        version: 0,
      },
      include: {
        locations: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Booking created. Please complete payment to confirm.',
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        vehicleName: booking.requestedVehicleName,
        location: booking.locations?.name,
        pickupDate: booking.pickupDate,
        dropDate: booking.dropDate,
        totalDays: booking.totalDays,
        dailyRate: booking.dailyRate,
        baseAmount: booking.baseAmount,
        gstAmount: booking.gstAmount,
        platformFee: booking.platformFee,
        grandTotal: booking.grandTotal,
        advanceAmount: booking.advanceAmount,
        advancePercentage: booking.advancePercentage,
        securityDeposit: booking.securityDeposit,
      },
    });
  } catch (error: any) {
    logger.error('Failed to create car booking', error);
    return NextResponse.json(
      { error: 'Failed to create booking', details: error?.message },
      { status: 500 }
    );
  }
}

// GET - List car bookings for a customer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const phone = searchParams.get('phone');
    const status = searchParams.get('status');

    if (!customerId && !phone) {
      return NextResponse.json(
        { error: 'Customer ID or phone required' },
        { status: 400 }
      );
    }

    const whereClause: any = {};

    if (customerId) {
      whereClause.customerId = customerId;
    } else if (phone) {
      whereClause.customerPhone = phone;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const bookings = await prisma.car_bookings.findMany({
      where: whereClause,
      include: {
        locations: { select: { name: true, slug: true } },
        vendors_car_bookings_acceptedVendorIdTovendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            rating: true,
          },
        },
        self_drive_quote_requests: { select: { numberOfVehicles: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        vehicleName: b.requestedVehicleName,
        vehicleType: b.requestedVehicleType,
        chauffeur_vehicle_categories: b.requestedCategory,
        transmission: b.requestedTransmission,
        fuelType: b.requestedFuelType,
        seats: b.requestedSeats,
        numberOfVehicles: b.self_drive_quote_requests?.numberOfVehicles ?? null,
        location: b.locations?.name,
        locationSlug: b.locations?.slug,
        pickupAddress: b.pickupAddress,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        dropDate: b.dropDate,
        dropTime: b.dropTime,
        totalDays: b.totalDays,
        dailyRate: b.dailyRate,
        baseAmount: b.baseAmount,
        gstAmount: b.gstAmount,
        platformFee: b.platformFee,
        grandTotal: b.grandTotal,
        advanceAmount: b.advanceAmount,
        advancePercentage: b.advancePercentage,
        securityDeposit: b.securityDeposit,
        kmLimitPerDay: b.kmLimitPerDay,
        extraKmRate: b.extraKmRate,
        status: b.status,
        paymentStatus: b.paymentStatus,
        vendor: b.vendors_car_bookings_acceptedVendorIdTovendors
          ? {
            name: b.vendors_car_bookings_acceptedVendorIdTovendors.businessName,
            phone: b.vendors_car_bookings_acceptedVendorIdTovendors.phone,
            rating: b.vendors_car_bookings_acceptedVendorIdTovendors.rating,
          }
          : null,
        rating: b.rating,
        review: b.review,
        createdAt: b.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch car bookings', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error?.message },
      { status: 500 }
    );
  }
}
