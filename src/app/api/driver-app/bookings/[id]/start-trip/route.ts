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
    const { otp, source = 'chauffeur' } = await request.json();

    if (!otp) {
      return NextResponse.json({ success: false, error: 'OTP is required' }, { status: 400 });
    }

    const isStaff = (driver as any).userType === 'vendor_staff';

    // ── CHAUFFEUR BOOKING ──────────────────────────────────────────────────────
    if (source === 'chauffeur') {
      const booking = await prisma.chauffeur_bookings.findUnique({
        where: { id: params.id },
        select: { id: true, acceptedDriverId: true, acceptedVendorId: true, status: true, tripStartOtp: true },
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
          tripStartOtp: null,
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
          status: true, tripStartOtp: true,
        },
      });

      if (!booking) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
      }

      // Authorization: match by vendorId + driverPhone (bus bookings use phone-based assignment)
      const driverPhone = (driver as any).phone;
      const isAuthorized = normalizePhone(booking.driverPhone) === normalizePhone(driverPhone) &&
        booking.vendorId === (driver as any).vendorId;

      if (!isAuthorized) {
        return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
      }

      if (booking.status !== 'VEHICLE_ASSIGNED') {
        return NextResponse.json({ success: false, error: 'Trip not ready to start' }, { status: 409 });
      }

      if (booking.tripStartOtp !== otp.toString()) {
        return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });
      }

      const updated = await prisma.bus_bookings.update({
        where: { id: params.id },
        data: {
          status: 'IN_PROGRESS',
          tripStartedAt: new Date(),
          tripStartOtp: null,
        },
      });

      return NextResponse.json({ success: true, booking: updated });
    }

    // ── PACKERS BOOKING (Start Packing) ───────────────────────────────────────
    if (source === 'packers') {
      const booking = await prisma.packers_bookings.findUnique({
        where: { id: params.id },
        select: { id: true, vendorId: true, teamLeaderPhone: true, status: true, packingOtp: true },
      });

      if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

      const driverPhone = (driver as any).phone;
      const isAuthorized = normalizePhone(booking.teamLeaderPhone) === normalizePhone(driverPhone) &&
        booking.vendorId === (driver as any).vendorId;

      if (!isAuthorized) return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
      if (booking.status !== 'TEAM_ASSIGNED') return NextResponse.json({ success: false, error: 'Trip not ready to start packing' }, { status: 409 });
      if (booking.packingOtp !== otp.toString()) return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });

      const updated = await prisma.packers_bookings.update({
        where: { id: params.id },
        data: { status: 'PACKING', packingStartedAt: new Date(), packingOtp: null },
      });

      return NextResponse.json({ success: true, booking: updated });
    }

    // ── TRUCK BOOKING (Start Loading) ─────────────────────────────────────────
    if (source === 'truck') {
      const booking = await prisma.truck_bookings.findUnique({
        where: { id: params.id },
        select: { id: true, vendorId: true, driverPhone: true, status: true, loadingOtp: true },
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

      if (booking.status !== 'VEHICLE_ASSIGNED') {
        return NextResponse.json({ success: false, error: 'Trip not ready to start loading' }, { status: 409 });
      }

      if (booking.loadingOtp !== otp.toString()) {
        return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });
      }

      const updated = await prisma.truck_bookings.update({
        where: { id: params.id },
        data: { status: 'LOADING', loadingStartedAt: new Date(), loadingOtp: null },
      });

      return NextResponse.json({ success: true, booking: updated });
    }

    // ── LUXURY BOOKING ────────────────────────────────────────────────────────
    if (source === 'luxury') {
      const booking = await prisma.luxury_bookings.findUnique({
        where: { id: params.id },
        select: {
          id: true, assignedVendorId: true, acceptedVendorId: true,
          driverPhone: true, status: true, tripStartOtp: true,
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

      if (booking.status !== 'DRIVER_ASSIGNED') {
        return NextResponse.json({ success: false, error: 'Trip not ready to start' }, { status: 409 });
      }

      if (booking.tripStartOtp !== otp.toString()) {
        return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });
      }

      const updated = await prisma.luxury_bookings.update({
        where: { id: params.id },
        data: {
          status: 'IN_PROGRESS',
          tripStartedAt: new Date(),
          tripStartOtp: null,
        },
      });

      return NextResponse.json({ success: true, booking: updated });
    }

    // ── EQUIPMENT BOOKING (Deliver Equipment) ─────────────────────────────────
    if (source === 'equipment') {
      const booking = await prisma.equipment_bookings.findUnique({
        where: { id: params.id },
        select: { id: true, vendorId: true, operatorPhone: true, status: true, deliveryOtp: true },
      });

      if (!booking) return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });

      const driverPhone = (driver as any).phone;
      const isAuthorized = normalizePhone(booking.operatorPhone) === normalizePhone(driverPhone) &&
        booking.vendorId === (driver as any).vendorId;

      if (!isAuthorized) return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
      if (booking.status !== 'CONFIRMED') return NextResponse.json({ success: false, error: 'Booking not ready for delivery' }, { status: 409 });
      if (booking.deliveryOtp !== otp.toString()) return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });

      const updated = await prisma.equipment_bookings.update({
        where: { id: params.id },
        data: { status: 'DELIVERED', deliveredAt2: new Date(), deliveryOtp: null },
      });

      return NextResponse.json({ success: true, booking: updated });
    }

    // ── B2B TRIP ───────────────────────────────────────────────────────────────
    if (source === 'b2b') {
      const trip = await prisma.b2b_trips.findUnique({
        where: { id: params.id },
        select: { id: true, vendorId: true, status: true, otp: true, bookingId: true },
      });

      if (!trip) return NextResponse.json({ success: false, error: 'Trip not found' }, { status: 404 });

      const driverVendorId = (driver as any).vendorId;
      if (trip.vendorId !== driverVendorId)
        return NextResponse.json({ success: false, error: 'Not authorized' }, { status: 403 });
      if (trip.status !== 'DRIVER_ARRIVED')
        return NextResponse.json({ success: false, error: 'Send OTP to customer first' }, { status: 409 });
      if (!trip.otp || trip.otp !== otp.toString())
        return NextResponse.json({ success: false, error: 'Invalid OTP' }, { status: 400 });

      await prisma.b2b_trips.update({
        where: { id: params.id },
        data: { status: 'STARTED', startedAt: new Date(), otp: null },
      });

      // Update booking to IN_PROGRESS if not yet started
      const b2bBooking = await prisma.b2b_bookings.findUnique({
        where: { id: trip.bookingId }, select: { status: true },
      });
      if (b2bBooking && ['TRIPS_CREATED', 'CONFIRMED'].includes(b2bBooking.status)) {
        await prisma.b2b_bookings.update({
          where: { id: trip.bookingId }, data: { status: 'IN_PROGRESS' },
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unsupported booking type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}
