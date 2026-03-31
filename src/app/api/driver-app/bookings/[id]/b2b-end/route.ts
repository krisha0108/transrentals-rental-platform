import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';
import { onTripCompleted } from '@/lib/utils/b2b-notification-helper';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const driver = await getDriverAppUser(request);
  if (!driver) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const trip = await prisma.b2b_trips.findUnique({
      where: { id: params.id },
      include: {
        booking: { select: { bookingNumber: true, customerId: true, serviceType: true } },
      },
    });

    if (!trip) {
      return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });
    }

    if (trip.vendorId !== (driver as any).vendorId) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    if (trip.status !== 'STARTED') {
      return NextResponse.json({ success: false, error: `Cannot end trip. Trip is ${trip.status}` }, { status: 409 });
    }

    await prisma.b2b_trips.update({
      where: { id: params.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    // If all trips for this booking are done → mark booking COMPLETED
    const bookingTrips = await prisma.b2b_trips.findMany({
      where: { bookingId: trip.bookingId },
      select: { status: true },
    });

    const allDone = bookingTrips.every(t =>
      ['COMPLETED', 'CANCELLED', 'VENDOR_CANCELLED'].includes(t.status)
    );

    if (allDone) {
      await prisma.b2b_bookings.update({
        where: { id: trip.bookingId },
        data: { status: 'COMPLETED' },
      });
    }

    onTripCompleted({
      tripCode: trip.tripCode,
      bookingId: trip.bookingId,
      bookingNumber: trip.booking?.bookingNumber || '',
      customerId: trip.booking?.customerId || '',
      serviceType: trip.booking?.serviceType || 'bus',
    }).catch(() => {});

    return NextResponse.json({ success: true, bookingCompleted: allDone });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
