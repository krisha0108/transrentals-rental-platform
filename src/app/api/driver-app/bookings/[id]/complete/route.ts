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
    const body = await request.json();
    const { actualKm, tollCharges, parkingCharges, source = 'chauffeur' } = body;

    const isStaff = (driver as any).userType === 'vendor_staff';

    // ── CHAUFFEUR BOOKING ──────────────────────────────────────────────────────
    if (source === 'chauffeur') {
      const booking = await prisma.chauffeur_bookings.findUnique({
        where: { id: params.id },
        select: { id: true, acceptedDriverId: true, acceptedVendorId: true, status: true, grandTotal: true },
      });

      if (!booking) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
      }

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
    }

    // ── BUS BOOKING ───────────────────────────────────────────────────────────
    if (source === 'bus') {
      const booking = await prisma.bus_bookings.findUnique({
        where: { id: params.id },
        select: {
          id: true, vendorId: true, driverPhone: true,
          status: true, totalAmount: true,
        },
      });

      if (!booking) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
      }

      const driverPhone = (driver as any).phone;
      const isAuthorized = normalizePhone(booking.driverPhone) === normalizePhone(driverPhone) &&
        booking.vendorId === (driver as any).vendorId;

      if (!isAuthorized) {
        return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
      }

      if (booking.status !== 'IN_PROGRESS') {
        return NextResponse.json({ success: false, error: 'Trip is not in progress' }, { status: 409 });
      }

      const updated = await prisma.bus_bookings.update({
        where: { id: params.id },
        data: {
          status: 'COMPLETED',
          tripEndedAt: new Date(),
          ...(actualKm && { actualKmTravelled: parseInt(actualKm) }),
        },
      });

      return NextResponse.json({ success: true, booking: updated });
    }

    // ── PACKERS BOOKING (Complete Job) ────────────────────────────────────────
    if (source === 'packers') {
      const booking = await prisma.packers_bookings.findUnique({
        where: { id: params.id },
        select: { id: true, vendorId: true, teamLeaderPhone: true, status: true },
      });

      if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

      const driverPhone = (driver as any).phone;
      if (normalizePhone(booking.teamLeaderPhone) !== normalizePhone(driverPhone) || booking.vendorId !== (driver as any).vendorId)
        return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });

      if (booking.status !== 'UNPACKING') return NextResponse.json({ success: false, error: 'Trip is not in unpacking phase' }, { status: 409 });

      const updated = await prisma.packers_bookings.update({
        where: { id: params.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      return NextResponse.json({ success: true, booking: updated });
    }

    // ── TRUCK BOOKING (Complete Delivery) ─────────────────────────────────────
    if (source === 'truck') {
      const booking = await prisma.truck_bookings.findUnique({
        where: { id: params.id },
        select: { id: true, vendorId: true, driverPhone: true, status: true },
      });

      if (!booking) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
      }

      const driverPhone = (driver as any).phone;
      const isAuthorized = normalizePhone(booking.driverPhone) === normalizePhone(driverPhone) &&
        booking.vendorId === (driver as any).vendorId;

      if (!isAuthorized) {
        return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
      }

      if (booking.status !== 'UNLOADING') {
        return NextResponse.json({ success: false, error: 'Trip is not in unloading phase' }, { status: 409 });
      }

      const updated = await prisma.truck_bookings.update({
        where: { id: params.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      return NextResponse.json({ success: true, booking: updated });
    }

    // ── LUXURY BOOKING ────────────────────────────────────────────────────────
    if (source === 'luxury') {
      const booking = await prisma.luxury_bookings.findUnique({
        where: { id: params.id },
        select: {
          id: true, assignedVendorId: true, acceptedVendorId: true,
          driverPhone: true, status: true, grandTotal: true,
        },
      });

      if (!booking) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
      }

      const driverPhone = (driver as any).phone;
      const driverVendorId = (driver as any).vendorId;
      const isAuthorized = normalizePhone(booking.driverPhone) === normalizePhone(driverPhone) &&
        (booking.assignedVendorId === driverVendorId || booking.acceptedVendorId === driverVendorId);

      if (!isAuthorized) {
        return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
      }

      if (booking.status !== 'IN_PROGRESS') {
        return NextResponse.json({ success: false, error: 'Trip is not in progress' }, { status: 409 });
      }

      const updated = await prisma.luxury_bookings.update({
        where: { id: params.id },
        data: {
          status: 'COMPLETED',
          tripEndedAt: new Date(),
          completedAt: new Date(),
          ...(actualKm && { actualHours: parseInt(actualKm) }),
        },
      });

      return NextResponse.json({ success: true, booking: updated });
    }

    // ── EQUIPMENT BOOKING ────────────────────────────────────────────────────
    if (source === 'equipment') {
      const booking = await prisma.equipment_bookings.findUnique({
        where: { id: params.id },
        select: { id: true, vendorId: true, operatorPhone: true, status: true },
      });

      if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

      const driverPhone = (driver as any).phone;
      const isAuthorized = normalizePhone(booking.operatorPhone) === normalizePhone(driverPhone) &&
        booking.vendorId === (driver as any).vendorId;

      if (!isAuthorized) return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
      if (booking.status !== 'RETURNED') return NextResponse.json({ success: false, error: 'Equipment not yet returned' }, { status: 409 });

      const updated = await prisma.equipment_bookings.update({
        where: { id: params.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      return NextResponse.json({ success: true, booking: updated });
    }

    return NextResponse.json({ success: false, error: 'Unsupported booking type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
