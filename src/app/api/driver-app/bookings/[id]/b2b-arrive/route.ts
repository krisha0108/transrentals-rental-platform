import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';

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
      select: { id: true, vendorId: true, status: true, tripCode: true },
    });

    if (!trip) {
      return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });
    }

    if (trip.vendorId !== (driver as any).vendorId) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    if (trip.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: `Cannot mark arrival. Trip is ${trip.status}` }, { status: 409 });
    }

    // Generate 4-digit OTP (driver shows this to customer)
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const updated = await prisma.b2b_trips.update({
      where: { id: params.id },
      data: {
        status: 'DRIVER_ARRIVED',
        driverArrivedAt: new Date(),
        otp,
        otpGeneratedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, otp, trip: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
