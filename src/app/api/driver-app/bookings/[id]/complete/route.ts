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
    const body = await request.json();
    const { actualKm, tollCharges, parkingCharges } = body;

    const booking = await prisma.chauffeur_bookings.findUnique({
      where: { id: params.id },
      select: { id: true, acceptedDriverId: true, acceptedVendorId: true, status: true, grandTotal: true },
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

    if (booking.status !== 'IN_PROGRESS') {
      return NextResponse.json({ success: false, error: 'Trip is not in progress' }, { status: 409 });
    }

    const updated = await prisma.chauffeur_bookings.update({
      where: { id: params.id },
      data: {
        status: 'COMPLETED',
        tripEndedAt: new Date(),
        completedAt: new Date(),
        // Mark full payment as received on trip completion
        ...(booking.grandTotal > 0 && {
          paidAmount: booking.grandTotal,
          remainingPayment: 0,
          paymentStatus: 'PAID',
        }),
        ...(actualKm && { actualKmTravelled: parseInt(actualKm) }),
        ...(tollCharges && { actualTollCharges: parseFloat(tollCharges) }),
        ...(parkingCharges && { actualParkingCharges: parseFloat(parkingCharges) }),
      },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
