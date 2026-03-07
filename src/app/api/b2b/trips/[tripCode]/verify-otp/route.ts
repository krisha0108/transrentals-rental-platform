// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { onTripStarted } from '@/lib/utils/b2b-notification-helper';

export const dynamic = 'force-dynamic';

// POST - Passenger verifies OTP from trip link to start trip
export async function POST(request: NextRequest, { params }: { params: { tripCode: string } }) {
  try {
    const { tripCode } = params;
    const body = await request.json();
    const { otp } = body;

    if (!otp) {
      return NextResponse.json({ error: 'OTP is required' }, { status: 400 });
    }

    const trip = await prisma.b2b_trips.findUnique({
      where: { tripCode },
      include: {
        booking: { select: { bookingNumber: true, companyName: true, customerId: true, serviceType: true } },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (trip.status !== 'DRIVER_ARRIVED') {
      return NextResponse.json(
        { error: trip.status === 'STARTED' ? 'Trip already started' : `Trip is in ${trip.status} status. Driver must arrive first.` },
        { status: 400 }
      );
    }

    if (!trip.otp) {
      return NextResponse.json({ error: 'OTP not generated yet. Driver must mark arrival first.' }, { status: 400 });
    }

    // Check OTP expiry (10 min)
    if (trip.otpGeneratedAt) {
      const expiryTime = new Date(trip.otpGeneratedAt.getTime() + 10 * 60 * 1000);
      if (new Date() > expiryTime) {
        return NextResponse.json({ error: 'OTP has expired. Ask driver to regenerate.' }, { status: 400 });
      }
    }

    if (trip.otp !== otp.toString().trim()) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    // OTP matched - start trip
    await prisma.b2b_trips.update({
      where: { tripCode },
      data: {
        status: 'STARTED',
        startedAt: new Date(),
      },
    });

    // Check if this is the first started trip — update booking to IN_PROGRESS
    const booking = await prisma.b2b_bookings.findUnique({
      where: { id: trip.bookingId },
      select: { status: true },
    });
    if (booking && booking.status === 'TRIPS_CREATED') {
      await prisma.b2b_bookings.update({
        where: { id: trip.bookingId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    // Notify customer that trip started
    onTripStarted({
      tripCode: trip.tripCode,
      bookingId: trip.bookingId,
      bookingNumber: trip.booking?.bookingNumber || '',
      driverName: trip.driverName || 'Driver',
      vehicleName: trip.vehicleName || 'Vehicle',
      customerId: trip.booking?.customerId || '',
      serviceType: trip.booking?.serviceType || 'bus',
    }).catch(e => console.error('Trip started notification error:', e));

    return NextResponse.json({
      status: 'success',
      message: 'Trip started successfully!',
      trip: {
        tripCode: trip.tripCode,
        status: 'STARTED',
        startedAt: new Date(),
        driverName: trip.driverName,
        vehicleNumber: trip.vehicleNumber,
      },
    });
  } catch (error: any) {
    console.error('Trip OTP verify error:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
