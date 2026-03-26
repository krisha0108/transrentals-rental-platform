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
    const { otp } = await request.json();

    if (!otp) {
      return NextResponse.json({ success: false, error: 'OTP is required' }, { status: 400 });
    }

    const booking = await prisma.chauffeur_bookings.findUnique({
      where: { id: params.id },
      select: { id: true, acceptedDriverId: true, acceptedVendorId: true, status: true, tripStartOtp: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const isStaff = (driver as any).userType === 'vendor_staff';
    const isAuthorized = isStaff
      ? booking.acceptedVendorId === (driver as any).vendorId
      : booking.acceptedDriverId === driver.id;

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    if (booking.status !== 'DRIVER_ASSIGNED') {
      return NextResponse.json({ success: false, error: 'Trip not ready to start' }, { status: 409 });
    }

    if (booking.tripStartOtp !== otp.toString()) {
      return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });
    }

    const updated = await prisma.chauffeur_bookings.update({
      where: { id: params.id },
      data: {
        status: 'IN_PROGRESS',
        tripStartedAt: new Date(),
        tripStartOtp: null, // clear OTP after use
      },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
