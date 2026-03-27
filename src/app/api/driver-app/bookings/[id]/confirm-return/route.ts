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

    if (!otp) return NextResponse.json({ success: false, error: 'OTP is required' }, { status: 400 });

    const driverPhone = (driver as any).phone;
    const driverVendorId = (driver as any).vendorId;

    const booking = await prisma.equipment_bookings.findUnique({
      where: { id: params.id },
      select: { id: true, vendorId: true, operatorPhone: true, status: true, returnOtp: true },
    });

    if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

    const isAuthorized = normalizePhone(booking.operatorPhone) === normalizePhone(driverPhone) &&
      booking.vendorId === driverVendorId;

    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    if (booking.status !== 'PICKUP_SCHEDULED') return NextResponse.json({ success: false, error: 'Pickup not scheduled yet' }, { status: 409 });
    if (booking.returnOtp !== otp.toString()) return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });

    const updated = await prisma.equipment_bookings.update({
      where: { id: params.id },
      data: { status: 'RETURNED', returnedAt: new Date(), returnOtp: null },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
