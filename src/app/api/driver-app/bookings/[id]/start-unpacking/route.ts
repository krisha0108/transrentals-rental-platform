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
    const booking = await prisma.packers_bookings.findUnique({
      where: { id: params.id },
      select: { id: true, vendorId: true, teamLeaderPhone: true, status: true },
    });

    if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

    const driverPhone = (driver as any).phone;
    if (normalizePhone(booking.teamLeaderPhone) !== normalizePhone(driverPhone) || booking.vendorId !== (driver as any).vendorId)
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });

    if (booking.status !== 'UNLOADING') return NextResponse.json({ success: false, error: 'Unloading not started yet' }, { status: 409 });

    const updated = await prisma.packers_bookings.update({
      where: { id: params.id },
      data: { status: 'UNPACKING', unloadingEndedAt: new Date(), unpackingStartedAt: new Date() },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
