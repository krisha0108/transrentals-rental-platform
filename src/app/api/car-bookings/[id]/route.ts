import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Fetch a single car booking by ID or booking number
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idOrNumber = params.id;

    // Try to find by booking number first, then by ID
    const booking = await prisma.chauffeur_bookings.findFirst({
      where: {
        OR: [
          { bookingNumber: idOrNumber },
          { id: idOrNumber },
        ],
      },
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
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        tripType: booking.tripType,
        carCategory: booking.carCategory,
        carCategoryName: booking.carCategoryName,
        pickupCity: booking.pickupCity,
        dropCity: booking.dropCity,
        pickupAddress: booking.pickupAddress,
        dropAddress: booking.dropAddress,
        pickupDate: booking.pickupDate,
        pickupTime: booking.pickupTime,
        returnDate: booking.returnDate,
        localPackageId: booking.localPackageId,
        localPackageHours: booking.localPackageHours,
        localPackageKm: booking.localPackageKm,
        baseFare: booking.baseFare,
        gstAmount: booking.gstAmount,
        platformFee: booking.platformFee,
        grandTotal: booking.grandTotal,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        driverName: booking.driverName,
        driverPhone: booking.driverPhone,
        driverPhoto: booking.driverPhoto,
        vehicleNumber: booking.vehicleNumber,
        vehicle_models: booking.vehicle_models,
        tripStartOtp: booking.tripStartOtp,
        vendor: booking.vendors_chauffeur_bookings_acceptedVendorIdTovendors,
        createdAt: booking.createdAt,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch car booking', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking', details: error?.message },
      { status: 500 }
    );
  }
}
