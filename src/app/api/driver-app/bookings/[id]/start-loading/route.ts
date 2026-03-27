import { NextRequest, NextResponse } from 'next/server';
import { getDriverAppUser } from '@/lib/auth/driver-app-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

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

    const booking = await prisma.packers_bookings.findUnique({
      where: { id: params.id },
      select: { id: true, vendorId: true, teamLeaderPhone: true, status: true, loadingOtp: true },
    });

    if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

    const driverPhone = (driver as any).phone;
    if (normalizePhone(booking.teamLeaderPhone) !== normalizePhone(driverPhone) || booking.vendorId !== (driver as any).vendorId)
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });

    if (booking.status !== 'PACKING') return NextResponse.json({ success: false, error: 'Packing not started yet' }, { status: 409 });
    if (booking.loadingOtp !== otp.toString()) return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });

    const updated = await prisma.packers_bookings.update({
      where: { id: params.id },
      data: { status: 'LOADING', packingEndedAt: new Date(), loadingStartedAt: new Date(), loadingOtp: null },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
