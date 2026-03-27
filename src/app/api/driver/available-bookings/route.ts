import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getDriver } from '@/lib/auth/driver-auth';

export const dynamic = 'force-dynamic';

// GET - available broadcasted bookings for independent drivers to accept
export async function GET(request: NextRequest) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

  try {
    const bookings = await prisma.chauffeur_bookings.findMany({
      where: { status: 'BROADCASTED', acceptedDriverId: null },
      orderBy: { pickupDate: 'asc' },
      select: {
        id: true, bookingNumber: true, tripType: true, carCategoryName: true,
        customerName: true, pickupCity: true, dropCity: true,
        pickupAddress: true, dropAddress: true,
        pickupDate: true, pickupTime: true, returnDate: true,
        estimatedDistance: true, grandTotal: true, driverBatta: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

// POST - accept a booking
export async function POST(request: NextRequest) {
  const driver = await getDriver(request);
  if (!driver) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  try {
    const { bookingId } = await request.json();
    if (!bookingId) return NextResponse.json({ success: false, error: 'bookingId required' }, { status: 400 });

    // Make sure it's still available
    const booking = await prisma.chauffeur_bookings.findFirst({
      where: { id: bookingId, status: 'BROADCASTED', acceptedDriverId: null },
    });
    if (!booking) return NextResponse.json({ success: false, error: 'Booking no longer available' }, { status: 409 });

    const updated = await prisma.chauffeur_bookings.update({
      where: { id: bookingId },
      data: {
        acceptedDriverId: driver.id,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, booking: updated, message: 'Booking accepted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
