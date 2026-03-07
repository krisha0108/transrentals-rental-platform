// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import { onTripCompleted } from '@/lib/utils/b2b-notification-helper';

export const dynamic = 'force-dynamic';

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit
}

// POST - Driver actions: ARRIVE, RESEND_OTP, END_TRIP
export async function POST(request: NextRequest, { params }: { params: { tripCode: string } }) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { tripCode } = params;
    const body = await request.json();
    const { action } = body; // 'arrive' | 'resend_otp' | 'end_trip'

    const trip = await prisma.b2b_trips.findUnique({
      where: { tripCode },
      include: {
        booking: { select: { bookingNumber: true, customerId: true, serviceType: true } },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Verify trip belongs to this vendor
    if (trip.vendorId !== auth.vendorId) {
      return NextResponse.json({ error: 'This trip does not belong to you' }, { status: 403 });
    }

    if (action === 'arrive') {
      if (trip.status !== 'PENDING') {
        return NextResponse.json({ error: `Cannot mark arrival. Trip is ${trip.status}` }, { status: 400 });
      }

      const otp = generateOTP();

      await prisma.b2b_trips.update({
        where: { tripCode },
        data: {
          status: 'DRIVER_ARRIVED',
          driverArrivedAt: new Date(),
          otp,
          otpGeneratedAt: new Date(),
        },
      });

      return NextResponse.json({
        status: 'success',
        message: 'Arrival marked. Share this OTP with the passenger.',
        otp,
        trip: {
          tripCode,
          status: 'DRIVER_ARRIVED',
          driverArrivedAt: new Date(),
        },
      });
    }

    if (action === 'resend_otp') {
      if (trip.status !== 'DRIVER_ARRIVED') {
        return NextResponse.json({ error: `Cannot resend OTP. Trip is ${trip.status}` }, { status: 400 });
      }

      const otp = generateOTP();

      await prisma.b2b_trips.update({
        where: { tripCode },
        data: {
          otp,
          otpGeneratedAt: new Date(),
        },
      });

      return NextResponse.json({
        status: 'success',
        message: 'New OTP generated and sent to customer.',
        trip: { tripCode, status: 'DRIVER_ARRIVED' },
      });
    }

    if (action === 'end_trip') {
      if (trip.status !== 'STARTED') {
        return NextResponse.json({ error: `Cannot end trip. Trip is ${trip.status}` }, { status: 400 });
      }

      await prisma.b2b_trips.update({
        where: { tripCode },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Check if all trips for this booking are completed
      const bookingTrips = await prisma.b2b_trips.findMany({
        where: { bookingId: trip.bookingId },
        select: { status: true },
      });

      const allCompleted = bookingTrips.every(t =>
        t.status === 'COMPLETED' || t.status === 'CANCELLED' || t.status === 'VENDOR_CANCELLED'
      );
      const hasAnyActive = bookingTrips.some(t =>
        t.status === 'PENDING' || t.status === 'DRIVER_ARRIVED' || t.status === 'STARTED'
      );

      if (allCompleted && !hasAnyActive) {
        await prisma.b2b_bookings.update({
          where: { id: trip.bookingId },
          data: { status: 'COMPLETED' },
        });
      }

      // Notify customer about trip completion
      onTripCompleted({
        tripCode,
        bookingId: trip.bookingId,
        bookingNumber: trip.booking?.bookingNumber || '',
        customerId: trip.booking?.customerId || '',
        serviceType: trip.booking?.serviceType || 'bus',
      }).catch(e => console.error('Trip completed notification error:', e));

      return NextResponse.json({
        status: 'success',
        message: 'Trip completed!',
        bookingCompleted: allCompleted && !hasAnyActive,
        trip: { tripCode, status: 'COMPLETED', completedAt: new Date() },
      });
    }

    return NextResponse.json({ error: 'Invalid action. Use "arrive", "resend_otp" or "end_trip"' }, { status: 400 });
  } catch (error: any) {
    console.error('Driver action error:', error);
    return NextResponse.json({ error: 'Failed to process driver action' }, { status: 500 });
  }
}
