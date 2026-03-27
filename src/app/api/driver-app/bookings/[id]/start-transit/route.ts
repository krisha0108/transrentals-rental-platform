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
    const { source = 'truck' } = await request.json().catch(() => ({ source: 'truck' }));
    const driverPhone = (driver as any).phone;
    const driverVendorId = (driver as any).vendorId;

    if (source === 'packers') {
      const booking = await prisma.packers_bookings.findUnique({
        where: { id: params.id },
        select: { id: true, vendorId: true, teamLeaderPhone: true, status: true },
      });
      if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
      if (normalizePhone(booking.teamLeaderPhone) !== normalizePhone(driverPhone) || booking.vendorId !== driverVendorId)
        return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
      if (booking.status !== 'LOADING') return NextResponse.json({ success: false, error: 'Loading not started yet' }, { status: 409 });
      const updated = await prisma.packers_bookings.update({
        where: { id: params.id },
        data: { status: 'IN_TRANSIT', loadingEndedAt: new Date(), transitStartedAt: new Date() },
      });
      return NextResponse.json({ success: true, booking: updated });
    }

    // default: truck
    const booking = await prisma.truck_bookings.findUnique({
      where: { id: params.id },
      select: { id: true, vendorId: true, driverPhone: true, status: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    const isAuthorized = normalizePhone(booking.driverPhone) === normalizePhone(driverPhone) &&
      booking.vendorId === driverVendorId;

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
    }

    if (booking.status !== 'LOADING') {
      return NextResponse.json({ success: false, error: 'Loading not started yet' }, { status: 409 });
    }

    const updated = await prisma.truck_bookings.update({
      where: { id: params.id },
      data: { status: 'IN_TRANSIT', loadingEndedAt: new Date(), transitStartedAt: new Date() },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
