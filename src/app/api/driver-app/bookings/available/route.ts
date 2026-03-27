import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET - Available bookings (BROADCASTED, not yet accepted by anyone)
export async function GET(request: NextRequest) {
  const driver = await getDriverAppUser(request);
  if (!driver) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const show = searchParams.get('show') || 'upcoming'; // upcoming | all

    const where: any = {
      status: 'BROADCASTED',
      acceptedVendorId: null,
      acceptedDriverId: null,
    };
    if (show === 'upcoming') {
      where.pickupDate = { gte: new Date(new Date().setHours(0, 0, 0, 0)) };
    }

    const bookings = await prisma.chauffeur_bookings.findMany({
      where,
      orderBy: { pickupDate: 'asc' },
      select: {
        id: true,
        bookingNumber: true,
        tripType: true,
        carCategory: true,
        carCategoryName: true,
        customerName: true,
        customerPhone: true,
        pickupCity: true,
        dropCity: true,
        pickupAddress: true,
        dropAddress: true,
        pickupDate: true,
        pickupTime: true,
        returnDate: true,
        returnTime: true,
        totalDays: true,
        totalHours: true,
        localPackageHours: true,
        localPackageKm: true,
        estimatedDistance: true,
        flightNumber: true,
        terminalNumber: true,
        airportName: true,
        baseFare: true,
        driverBatta: true,
        grandTotal: true,
        paidAmount: true,
        remainingPayment: true,
        locationName: true,
        broadcastedAt: true,
        responseDeadline: true,
        createdAt: true,
      },
    });

    // Normalize: add source + serviceLabel, uppercase tripType for consistent filtering
    const normalized = bookings.map(b => ({
      ...b,
      source: 'chauffeur',
      tripType: b.tripType?.toUpperCase() ?? b.tripType,
      serviceLabel: b.tripType,
    }));

    return NextResponse.json({ success: true, bookings: normalized });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
