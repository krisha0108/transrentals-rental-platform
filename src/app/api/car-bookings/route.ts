// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate booking number for Car Booking (with driver)
function generateBookingNumber(): string {
  const prefix = 'CB'; // Car Booking
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// Helper to generate OTP
function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Map trip type string to enum
function mapTripType(tripType: string): string {
  const mapping: Record<string, string> = {
    local: 'LOCAL',
    outstation: 'OUTSTATION_ROUNDTRIP',
    'outstation-oneway': 'OUTSTATION_ONEWAY',
    'outstation-roundtrip': 'OUTSTATION_ROUNDTRIP',
    airport: 'AIRPORT_PICKUP',
    'airport-pickup': 'AIRPORT_PICKUP',
    'airport-drop': 'AIRPORT_DROP',
  };
  return mapping[tripType.toLowerCase()] || 'LOCAL';
}

// POST - Create a new Car Booking (with driver)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      // Trip details
      tripType,
      carCategory,
      carCategoryName,
      pickupCity,
      dropCity,
      pickupAddress,
      dropAddress,
      pickupDate,
      pickupTime,
      returnDate,
      mode,
      airportMode,

      // Local package
      localPackageId,
      localPackageHours,
      localPackageKm,

      // Customer info
      customerName,
      customerEmail,
      customerPhone,
      customerId,
      customerNotes,

      // Pricing
      baseFare,
      gstAmount,
      platformFee = 99,
      grandTotal,
    } = body;

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: 'Customer details are required' },
        { status: 400 }
      );
    }

    if (!pickupCity || !pickupDate || !carCategory) {
      return NextResponse.json(
        { error: 'Trip details are required' },
        { status: 400 }
      );
    }

    if (!baseFare || !grandTotal) {
      return NextResponse.json(
        { error: 'Pricing information is required' },
        { status: 400 }
      );
    }

    // Find location (MySQL default collation is case-insensitive)
    const location = await prisma.locations.findFirst({
      where: {
        OR: [
          { name: { contains: pickupCity } },
          { slug: pickupCity.toLowerCase().replace(/\s+/g, '-') },
        ],
        isActive: true,
      },
    });

    // Generate booking number and OTP
    const bookingNumber = generateBookingNumber();
    const tripStartOtp = generateOTP();

    // Set response deadline (2 hours from now for vendor to respond)
    const responseDeadline = new Date();
    responseDeadline.setHours(responseDeadline.getHours() + 2);

    // Calculate total days for outstation
    let totalDays = 1;
    if (returnDate && pickupDate) {
      const diff = new Date(returnDate).getTime() - new Date(pickupDate).getTime();
      totalDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    // Map trip type to enum
    let mappedTripType = mapTripType(tripType);
    if (tripType === 'outstation' && mode === 'one-way') {
      mappedTripType = 'OUTSTATION_ONEWAY';
    }
    if (tripType === 'airport') {
      mappedTripType = airportMode === 'drop' ? 'AIRPORT_DROP' : 'AIRPORT_PICKUP';
    }

    // Create the booking
    const booking = await prisma.chauffeur_bookings.create({
      data: {
        bookingNumber,
        customerId: customerId || null,
        customerName,
        customerEmail,
        customerPhone,
        locationId: location?.id || '',
        locationName: pickupCity,
        tripType: mappedTripType as any,
        localPackageId: tripType === 'local' ? localPackageId : null,
        localPackageHours: tripType === 'local' ? localPackageHours : null,
        localPackageKm: tripType === 'local' ? localPackageKm : null,
        pickupCity,
        dropCity: dropCity || null,
        pickupAddress: pickupAddress || null,
        dropAddress: dropAddress || null,
        carCategory,
        carCategoryName: carCategoryName || carCategory,
        pickupDate: new Date(pickupDate),
        pickupTime,
        returnDate: returnDate ? new Date(returnDate) : null,
        totalDays,
        totalHours: localPackageHours || null,
        baseFare,
        perKmRate: 0, // Would be set based on car category
        gstAmount,
        platformFee,
        grandTotal,
        tripStartOtp,
        status: 'PENDING_VENDOR',
        responseDeadline,
        broadcastedAt: new Date(), // Broadcast immediately to all vendors
        customerNotes: customerNotes || null,
      },
      include: {
        locations: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully. Finding a driver for you.',
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        tripType: booking.tripType,
        carCategory: booking.carCategoryName,
        pickupCity: booking.pickupCity,
        dropCity: booking.dropCity,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        grandTotal: booking.grandTotal,
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

// GET - List Car Bookings for a customer
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

    const bookings = await prisma.chauffeur_bookings.findMany({
      where: whereClause,
      include: {
        locations: { select: { name: true, slug: true } },
        vendors_chauffeur_bookings_acceptedVendorIdTovendors: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            rating: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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
        pickupAddress: b.pickupAddress,
        pickupDate: b.pickupDate,
        pickupTime: b.pickupTime,
        returnDate: b.returnDate,
        localPackageId: b.localPackageId,
        localPackageHours: b.localPackageHours,
        localPackageKm: b.localPackageKm,
        grandTotal: b.grandTotal,
        status: b.status,
        driverName: b.driverName,
        driverPhone: b.driverPhone,
        vehicleNumber: b.vehicleNumber,
        vehicle_models: b.vehicle_models,
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
