// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { authOptions } from '@/lib/auth/auth-options';
import { emitNewBooking, BookingNotification } from '@/lib/socket';
import logger from '@/lib/security/logger';
import { sanitizeInput, isValidEmail, isValidPhone, sanitizePhone } from '@/lib/utils/sanitize';
import { smartRateLimit, detectDuplicate, getClientIdentifier, hashBookingData } from '@/lib/utils/smart-rate-limit';
import { calculateRentalDuration } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// Generate unique booking number
function generateBookingNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `BK-${year}-${random}`;
}

// Calculate booking amount
function calculateBookingAmount(dailyRate: number, totalDays: number, securityDeposit: number) {
  const totalAmount = dailyRate * totalDays;
  const gstAmount = Math.round(totalAmount * 0.18);
  const grandTotal = totalAmount + gstAmount;

  return {
    totalAmount,
    gstAmount,
    grandTotal,
    securityDeposit,
  };
}

// POST - Create a new bike booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ✅ SMART RATE LIMITING (Customer Friendly)
    const clientId = getClientIdentifier(request);
    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session?.user;

    // Check rate limit (10 for guests, 20 for authenticated)
    const rateLimitCheck = await smartRateLimit(clientId, isAuthenticated, body);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: rateLimitCheck.error,
          requiresCaptcha: rateLimitCheck.requiresCaptcha,
          type: 'rate_limit'
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60'
          }
        }
      );
    }

    // ✅ DETECT DUPLICATE/BOT (Same booking data repeatedly)
    const bookingHash = hashBookingData(body);
    const duplicateCheck = await detectDuplicate(bookingHash);

    if (duplicateCheck.isDuplicate) {
      return NextResponse.json(
        {
          error: duplicateCheck.error,
          type: 'duplicate_booking'
        },
        { status: 400 }
      );
    }

    let {
      customerId,
      customerName,
      customerEmail,
      customerPhone,
      vehicleId,
      vehicleModelId,      // NEW: VehicleModel ID for multi-vendor booking
      vehicleName,
      vehicleBrand,
      vehicle_category, // Scooter, Bike, Sports, Cruiser
      locationId,
      locationSlug,
      locationName,
      pickupDate,
      pickupTime,
      dropDate,
      dropTime,
      dailyRate,
      securityDeposit = 2000,
      helmetsRequired = 1,
      customerNotes = '',
      vendorId,
      broadcastToAll = false, // NEW: Force broadcast to all vendors
    } = body;

    // ✅ SANITIZE USER INPUTS (XSS Protection)
    customerName = sanitizeInput(customerName);
    vehicleName = sanitizeInput(vehicleName);
    vehicleBrand = sanitizeInput(vehicleBrand);
    customerNotes = sanitizeInput(customerNotes);
    customerPhone = sanitizePhone(customerPhone);

    // ✅ VALIDATE EMAIL FORMAT
    if (customerEmail && !isValidEmail(customerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // ✅ VALIDATE PHONE NUMBER
    if (customerPhone && !isValidPhone(customerPhone)) {
      return NextResponse.json(
        { error: 'Invalid phone number. Must be 10 digits starting with 6-9' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!customerPhone || !vehicleName || !pickupDate || !dropDate) {
      return NextResponse.json(
        { error: 'Missing required fields: customerPhone, vehicleName, pickupDate, dropDate are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const pickup = new Date(pickupDate);
    const drop = new Date(dropDate);

    // Check if dates are valid
    if (isNaN(pickup.getTime()) || isNaN(drop.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Please provide valid dates.' },
        { status: 400 }
      );
    }

    // Check if drop date is before pickup date
    // Allow same-day bookings (drop date = pickup date) as drop time will be later
    if (drop < pickup) {
      return NextResponse.json(
        { error: 'Drop date cannot be before pickup date' },
        { status: 400 }
      );
    }

    // Calculate duration with proper time precision
    const duration = calculateRentalDuration(
      pickup,
      pickupTime || '10:00',
      drop,
      dropTime || pickupTime || '10:00'
    );
    const totalDays = duration.totalDays;
    const totalHours = duration.totalHours;

    // Calculate amounts
    const amounts = calculateBookingAmount(dailyRate || 299, totalDays, securityDeposit);

    // Find location if slug provided
    let resolvedLocationId = locationId;
    let resolvedLocationName = locationName || '';

    if (!resolvedLocationId && (locationSlug || locationName)) {
      // Try to find location by slug or name
      const orConditions: any[] = [];
      if (locationSlug) {
        orConditions.push({ slug: locationSlug });
        orConditions.push({ slug: { contains: locationSlug } });
      }
      if (locationName) {
        orConditions.push({ name: locationName });
        orConditions.push({ name: { contains: locationName } });
      }

      if (orConditions.length > 0) {
        const location = await prisma.locations.findFirst({
          where: {
            OR: orConditions,
            isActive: true,
          },
          select: { id: true, name: true },
        });
        if (location) {
          resolvedLocationId = location.id;
          resolvedLocationName = location.name;
        }
      }
    } else if (resolvedLocationId && !resolvedLocationName) {
      const location = await prisma.locations.findUnique({
        where: { id: resolvedLocationId },
        select: { name: true },
      });
      resolvedLocationName = location?.name || '';
    }

    if (!resolvedLocationId) {
      logger.warn('Location not found', { locationId, locationSlug, locationName });
      return NextResponse.json(
        {
          error: 'Valid location is required',
          details: `Could not find location: ${locationName || locationSlug}. Please select a valid city.`
        },
        { status: 400 }
      );
    }

    // Find vehicle owner (vendor) if vehicle ID provided
    let assignedVendorId: string | null = vendorId || null;
    let notifiedVendorIds: string[] = [];
    let resolvedVehicleModelId: string | null = vehicleModelId || null;
    let resolvedVehicleName = vehicleName;
    let resolvedVehicleBrand = vehicleBrand || null;

    // If vehicleModelId is provided, find all vendors with this model at this location
    if (vehicleModelId || broadcastToAll) {
      // Get vehicle model info
      if (vehicleModelId) {
        const vehicle_model = await prisma.vehicle_models.findUnique({
          where: { id: vehicleModelId },
          include: {
            brand: { select: { name: true } },
          },
        });
        if (vehicle_model) {
          resolvedVehicleName = vehicle_model.name;
          resolvedVehicleBrand = vehicle_model.brands.name;
        }
      }

      // Find all vendors with this model at this location
      const vendorFleets = await prisma.vendor_fleets.findMany({
        where: {
          vehicleModelId: vehicleModelId || undefined,
          isActive: true,
          isAvailable: true,
          vendors: {
            status: 'APPROVED',
          },
          vendor_fleet_locations: {
            some: {
              locationId: resolvedLocationId,
              isActive: true,
            },
          },
        },
        select: {
          vendorId: true,
        },
        distinct: ['vendorId'],
      });

      notifiedVendorIds = vendorFleets.map((f: any) => f.vendorId);

      // For multi-vendor broadcast, don't assign to a single vendor
      if (notifiedVendorIds.length > 0 && broadcastToAll) {
        assignedVendorId = null;
      }
    } else if (!assignedVendorId && vehicleId) {
      // Legacy: Find vehicle owner if vehicle ID provided
      const vehicle = await prisma.vendor_fleets.findUnique({
        where: { id: vehicleId },
        select: { vendorId: true, vehicleModelId: true },
      });
      assignedVendorId = vehicle?.vendorId || null;
      resolvedVehicleModelId = vehicle?.vehicle_modelsId || null;

      // For single vendor booking, also add them to notified list
      if (assignedVendorId) {
        notifiedVendorIds = [assignedVendorId];
      }
    }

    // Calculate response deadline (2 hours from now for direct requests)
    const responseDeadline = new Date();
    responseDeadline.setHours(responseDeadline.getHours() + 2);

    // Determine if this is a broadcast booking
    const isBroadcast = broadcastToAll || (!assignedVendorId && notifiedVendorIds.length > 0);

    // Calculate advance amount (30% of grand total)
    const advanceAmount = Math.round(amounts.grandTotal * 0.3);

    // Create booking - ALWAYS start with PENDING_PAYMENT status
    // Flow: PENDING_PAYMENT -> Customer pays -> PAYMENT_SUBMITTED -> Admin verifies -> PAYMENT_VERIFIED -> BROADCASTED/PENDING_VENDOR -> Vendor accepts -> ACCEPTED
    const booking = await prisma.bike_bookings.create({
      data: {
        bookingNumber: generateBookingNumber(),
        customerId: customerId || null,
        customerName: customerName || 'Guest',
        customerEmail: customerEmail || '',
        customerPhone,
        locationId: resolvedLocationId,
        locationName: resolvedLocationName,
        requestedVehicleId: vehicleId || null,
        requestedModelId: resolvedVehicleModelId,
        requestedVehicleName: resolvedVehicleName,
        requestedBrand: resolvedVehicleBrand,
        requestedCategory: vehicle_category || null,
        assignedVendorId: isBroadcast ? null : assignedVendorId,
        notifiedVendorIds: notifiedVendorIds.length > 0 ? JSON.stringify(notifiedVendorIds) : null,
        pickupDate: pickup,
        pickupTime: pickupTime || '10:00',
        dropDate: drop,
        dropTime: dropTime || '18:00',
        totalDays,
        dailyRate: dailyRate || 299,
        totalAmount: amounts.totalAmount,
        gstAmount: amounts.gstAmount,
        securityDeposit: amounts.securityDeposit,
        grandTotal: amounts.grandTotal,
        advanceAmount: advanceAmount,
        helmetsRequired,
        customerNotes: customerNotes || null,
        // IMPORTANT: Start with PENDING_PAYMENT, not BROADCASTED
        status: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
        // Don't set response deadline until payment is verified
        responseDeadline: null,
        broadcastedAt: null,
        version: 0, // Initialize version for optimistic locking
        source: body.source || 'web',
      },
      include: {
        locations: { select: { name: true, slug: true } },
        vendors_bike_bookings_assignedVendorIdTovendors: { select: { id: true, businessName: true, phone: true } },
      },
    });

    // DON'T notify vendors yet - only after payment is verified
    // Vendors will be notified when admin verifies payment and status changes to PAYMENT_VERIFIED/BROADCASTED

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        vehicleName: booking.requestedVehicleName,
        vehicleModelId: booking.requestedModelId,
        vehicleBrand: booking.requestedBrand,
        chauffeur_vehicle_categories: booking.requestedCategory,
        location: booking.locations,
        locationName: booking.locationName,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        dropDate: booking.dropDate,
        dropTime: booking.dropTime,
        totalDays: booking.totalDays,
        dailyRate: booking.dailyRate,
        totalAmount: booking.totalAmount,
        gstAmount: booking.gstAmount,
        securityDeposit: booking.securityDeposit,
        grandTotal: booking.grandTotal,
        advanceAmount: booking.advanceAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        vendor: booking.vendors_bike_bookings_assignedVendorIdTovendors,
        responseDeadline: booking.responseDeadline,
        notifiedVendorCount: notifiedVendorIds.length,
        isBroadcast,
        createdAt: booking.createdAt,
      },
      message: 'Booking created. Please complete advance payment to proceed.',
      nextStep: 'PAYMENT',
      paymentInfo: {
        advanceAmount: advanceAmount,
        totalAmount: amounts.grandTotal,
        advancePercentage: 30,
      },
    });
  } catch (error: any) {
    logger.error('Failed to create bike booking', error);
    return NextResponse.json(
      { error: 'Failed to create booking', details: error?.message },
      { status: 500 }
    );
  }
}

// GET - List bookings for a customer
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);

    const customerPhone = searchParams.get('phone');
    const customerEmail = searchParams.get('email');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause with OR conditions (flexible matching)
    const whereClause: any = {};
    const customerConditions: any[] = [];

    console.log('🔍 Bike Bookings Query Params:', { customerId, customerEmail, customerPhone });

    // Add all available identifiers to OR array
    if (customerId) {
      customerConditions.push({ customerId: customerId });
    }
    if (customerEmail) {
      customerConditions.push({ customerEmail: customerEmail });
    }
    if (customerPhone) {
      customerConditions.push({ customerPhone: customerPhone });
    }
    if (session?.user?.email && !customerEmail) {
      customerConditions.push({ customerEmail: session.user.email });
    }

    // Use OR if multiple conditions, otherwise single condition
    if (customerConditions.length > 1) {
      whereClause.OR = customerConditions;
    } else if (customerConditions.length === 1) {
      Object.assign(whereClause, customerConditions[0]);
    }

    console.log('🔍 Where Clause:', JSON.stringify(whereClause, null, 2));

    // Status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        whereClause.status = {
          in: ['PENDING_PAYMENT', 'PENDING_VENDOR', 'BROADCASTED', 'ACCEPTED', 'IN_PROGRESS'],
        };
      } else if (status === 'completed') {
        whereClause.status = 'COMPLETED';
      } else if (status === 'cancelled') {
        whereClause.status = { in: ['CANCELLED', 'EXPIRED', 'REFUNDED'] };
      } else {
        whereClause.status = status;
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.bike_bookings.findMany({
        where: whereClause,
        include: {
          locations: { select: { name: true, slug: true } },
          vendors_bike_bookings_acceptedVendorIdTovendors: { select: { id: true, businessName: true, phone: true, rating: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.bike_bookings.count({ where: whereClause }),
    ]);

    console.log('📊 Query Results:', { total, bookingsFound: bookings.length });
    if (bookings.length > 0) {
      console.log('📋 First Booking Details:', {
        id: bookings[0].id,
        customerId: bookings[0].customerId,
        customerPhone: bookings[0].customerPhone,
        customerEmail: bookings[0].customerEmail,
      });
    }

    // Also check if there are ANY bike bookings in database
    const allBookingsCount = await prisma.bike_bookings.count();
    console.log('🔢 Total Bike Bookings in DB:', allBookingsCount);

    return NextResponse.json({
      success: true,
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        customerName: b.customerName,
        customerEmail: b.customerEmail,
        customerPhone: b.customerPhone,
        vehicleName: b.requestedVehicleName,
        vehicleBrand: b.requestedBrand,
        chauffeur_vehicle_categories: b.requestedCategory,
        assignedVehicle: b.acceptedVehicleName,
        location: b.locations,
        locationName: b.locationName,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        dropDate: b.dropDate,
        dropTime: b.dropTime,
        totalDays: b.totalDays,
        dailyRate: b.dailyRate,
        totalAmount: b.totalAmount,
        gstAmount: b.gstAmount,
        securityDeposit: b.securityDeposit,
        grandTotal: b.grandTotal,
        status: b.status,
        paymentStatus: b.paymentStatus,
        vendor: b.vendors_bike_bookings_acceptedVendorIdTovendors ? {
          id: b.vendors_bike_bookings_acceptedVendorIdTovendors.id,
          name: b.vendors_bike_bookings_acceptedVendorIdTovendors.businessName,
          phone: b.vendors_bike_bookings_acceptedVendorIdTovendors.phone,
          rating: b.vendors_bike_bookings_acceptedVendorIdTovendors.rating,
        } : null,
        acceptedAt: b.acceptedAt,
        pickedUpAt: b.pickedUpAt,
        returnedAt: b.returnedAt,
        createdAt: b.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch bike bookings', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error?.message },
      { status: 500 }
    );
  }
}
