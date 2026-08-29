// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

// GET — single booking detail (includes assigned driver + vehicle via separate lookups)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use raw query so new columns (assignedDriverId, assignedVehicleId, assignedAt)
  // are returned even before Prisma client is regenerated
  const rows: any[] = await prisma.$queryRaw`
    SELECT * FROM vendor_direct_bookings
    WHERE id = ${params.id} AND vendorId = ${auth.vendorId}
    LIMIT 1
  `;
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const booking = rows[0];

  // Fetch assigned driver & vehicle separately
  const [assignedDriver, assignedVehicle] = await Promise.all([
    booking.assignedDriverId
      ? prisma.vendor_staff.findUnique({
          where: { id: booking.assignedDriverId },
          select: { id: true, name: true, phone: true, profilePhoto: true, licenseNumber: true, licenseExpiry: true },
        })
      : null,
    booking.assignedVehicleId
      ? prisma.vendor_fleets.findUnique({
          where: { id: booking.assignedVehicleId },
          select: { id: true, vehicleName: true, registrationNumber: true, color: true, fuelType: true, seatingCapacity: true },
        })
      : null,
  ]);

  return NextResponse.json({ booking: { ...booking, assignedDriver, assignedVehicle } });
}

// PUT — update status / payment / notes / assignment
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Block rejected/blocked vendors — suspended vendors can still manage
  // their own direct bookings (offline/personal, not platform-routed).
  const _guard = await vendorStatusGuard(auth.vendorId!, { allowSuspended: true });
  if (_guard.blocked) return _guard.response;

  // Verify ownership via raw query
  const rows: any[] = await prisma.$queryRaw`
    SELECT id FROM vendor_direct_bookings
    WHERE id = ${params.id} AND vendorId = ${auth.vendorId}
    LIMIT 1
  `;
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const {
    status, paymentStatus, paymentMode, paidAmount,
    totalAmount, vendorNotes, vehicleType,
    pickupDate, returnDate, pickupLocation, dropLocation,
    razorpayLinkId,
    assignedDriverId, assignedVehicleId,
  } = body;

  // Build update using standard Prisma update (works for all old fields)
  // New fields (assignedDriverId, assignedVehicleId, assignedAt) via raw SQL patch
  const updated = await prisma.vendor_direct_bookings.update({
    where: { id: params.id },
    data: {
      ...(status !== undefined && { status }),
      ...(paymentStatus !== undefined && { paymentStatus }),
      ...(paymentMode !== undefined && { paymentMode }),
      ...(paidAmount !== undefined && { paidAmount: parseFloat(paidAmount) }),
      ...(totalAmount !== undefined && { totalAmount: parseFloat(totalAmount) }),
      ...(vendorNotes !== undefined && { vendorNotes }),
      ...(vehicleType !== undefined && { vehicleType }),
      ...(pickupDate !== undefined && { pickupDate: pickupDate ? new Date(pickupDate) : null }),
      ...(returnDate !== undefined && { returnDate: returnDate ? new Date(returnDate) : null }),
      ...(pickupLocation !== undefined && { pickupLocation }),
      ...(dropLocation !== undefined && { dropLocation }),
      ...(razorpayLinkId !== undefined && { razorpayLinkId }),
    },
  });

  // Patch assignment fields via raw SQL (new columns not yet in Prisma client)
  const now = new Date();
  if (assignedDriverId !== undefined) {
    if (assignedDriverId) {
      await prisma.$executeRaw`
        UPDATE vendor_direct_bookings
        SET assignedDriverId = ${assignedDriverId}, assignedAt = ${now}
        WHERE id = ${params.id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE vendor_direct_bookings
        SET assignedDriverId = NULL
        WHERE id = ${params.id}
      `;
    }
  }
  if (assignedVehicleId !== undefined) {
    if (assignedVehicleId) {
      await prisma.$executeRaw`
        UPDATE vendor_direct_bookings
        SET assignedVehicleId = ${assignedVehicleId}, assignedAt = ${now}
        WHERE id = ${params.id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE vendor_direct_bookings
        SET assignedVehicleId = NULL
        WHERE id = ${params.id}
      `;
    }
  }

  // Re-fetch with new fields so UI gets fresh data
  const freshRows: any[] = await prisma.$queryRaw`
    SELECT * FROM vendor_direct_bookings WHERE id = ${params.id} LIMIT 1
  `;
  const freshBooking = freshRows[0];

  const [assignedDriver, assignedVehicle] = await Promise.all([
    freshBooking.assignedDriverId
      ? prisma.vendor_staff.findUnique({
          where: { id: freshBooking.assignedDriverId },
          select: { id: true, name: true, phone: true, profilePhoto: true, licenseNumber: true, licenseExpiry: true },
        })
      : null,
    freshBooking.assignedVehicleId
      ? prisma.vendor_fleets.findUnique({
          where: { id: freshBooking.assignedVehicleId },
          select: { id: true, vehicleName: true, registrationNumber: true, color: true, fuelType: true, seatingCapacity: true },
        })
      : null,
  ]);

  return NextResponse.json({ booking: { ...freshBooking, assignedDriver, assignedVehicle } });
}

// DELETE — cancel booking
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Block rejected/blocked vendors — suspended vendors can still manage
  // their own direct bookings (offline/personal, not platform-routed).
  const _guard = await vendorStatusGuard(auth.vendorId!, { allowSuspended: true });
  if (_guard.blocked) return _guard.response;

  const rows: any[] = await prisma.$queryRaw`
    SELECT id FROM vendor_direct_bookings
    WHERE id = ${params.id} AND vendorId = ${auth.vendorId}
    LIMIT 1
  `;
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.vendor_direct_bookings.update({
    where: { id: params.id },
    data: { status: 'cancelled' },
  });

  return NextResponse.json({ success: true });
}
