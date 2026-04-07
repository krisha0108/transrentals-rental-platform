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
    // Use a transaction to prevent race conditions (first come first serve)
    const booking = await prisma.$transaction(async (tx) => {
      const existing = await tx.chauffeur_bookings.findUnique({
        where: { id: params.id },
        select: { id: true, status: true, acceptedVendorId: true, acceptedDriverId: true },
      });

      if (!existing) {
        throw new Error('Booking not found');
      }

      if (existing.status !== 'BROADCASTED') {
        throw new Error('Booking is no longer available');
      }

      if (existing.acceptedVendorId || existing.acceptedDriverId) {
        throw new Error('Booking already accepted by someone else');
      }

      const isStaff = (driver as any).userType === 'vendor_staff';

      return tx.chauffeur_bookings.update({
        where: { id: params.id },
        data: {
          ...(isStaff
            ? { acceptedVendorId: (driver as any).vendorId }
            : { acceptedDriverId: driver.id }
          ),
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          driverName: (driver as any).name,
          driverPhone: (driver as any).phone,
          driverPhoto: (driver as any).profilePhoto,
        },
      });
    });

    return NextResponse.json({ success: true, booking: { ...booking, source: 'chauffeur' } });
  } catch (error: any) {
    const msg = error?.message || String(error) || 'Unknown error';
    console.error('[accept booking]', msg, error?.code, error?.meta);
    const status = msg.includes('no longer available') || msg.includes('already accepted') ? 409 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
