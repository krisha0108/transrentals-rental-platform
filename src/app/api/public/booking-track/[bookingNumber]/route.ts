// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { resolveAssetUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingNumber: string } }
) {
  const { bookingNumber } = params;

  // Use raw query so new columns (assignedDriverId, assignedVehicleId) are included
  const rows: any[] = await prisma.$queryRaw`
    SELECT b.bookingNumber, b.status, b.serviceType, b.vehicleType,
           b.pickupDate, b.returnDate, b.pickupLocation, b.dropLocation,
           b.notes, b.paymentStatus, b.totalAmount, b.paidAmount,
           b.bookingSource, b.createdAt, b.updatedAt,
           b.assignedDriverId, b.assignedVehicleId,
           v.businessName, v.city, v.phone AS vendorPhone, v.logo, v.slug
    FROM vendor_direct_bookings b
    JOIN vendors v ON v.id = b.vendorId
    WHERE b.bookingNumber = ${bookingNumber}
    LIMIT 1
  `;

  if (!rows.length) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  const row = rows[0];

  // Fetch assigned driver & vehicle separately (new columns may not be in Prisma client yet)
  const [assignedDriver, assignedVehicle] = await Promise.all([
    row.assignedDriverId
      ? prisma.vendor_staff.findUnique({
          where: { id: row.assignedDriverId },
          select: {
            id: true, name: true, phone: true, profilePhoto: true, slug: true,
            isSharingLocation: true, currentLat: true, currentLng: true,
            currentHeading: true, locationUpdatedAt: true,
          },
        })
      : null,
    row.assignedVehicleId
      ? prisma.vendor_fleets.findUnique({
          where: { id: row.assignedVehicleId },
          select: { id: true, vehicleName: true, registrationNumber: true, color: true, fuelType: true, seatingCapacity: true, images: true },
        })
      : null,
  ]);

  // Parse vehicle images JSON and resolve URLs
  let vehicleImages: string[] = [];
  if (assignedVehicle?.images) {
    try {
      const raw = typeof assignedVehicle.images === 'string'
        ? JSON.parse(assignedVehicle.images)
        : assignedVehicle.images;
      const LABEL_ORDER = ['front', 'back', 'leftSide', 'rightSide', 'inside'];
      vehicleImages = LABEL_ORDER
        .map(k => raw[k])
        .filter(Boolean)
        .map((p: string) => resolveAssetUrl(p));
    } catch (_) {}
  }

  // Only expose the driver's live position while the trip is actually running
  // and the driver has opted in to sharing — never leak a stale/idle location.
  const TRIP_ACTIVE = ['confirmed', 'in_progress'].includes(row.status);
  const liveLocation =
    assignedDriver &&
    TRIP_ACTIVE &&
    (assignedDriver as any).isSharingLocation &&
    (assignedDriver as any).currentLat != null &&
    (assignedDriver as any).currentLng != null
      ? {
          lat: (assignedDriver as any).currentLat,
          lng: (assignedDriver as any).currentLng,
          heading: (assignedDriver as any).currentHeading ?? null,
          updatedAt: (assignedDriver as any).locationUpdatedAt ?? null,
        }
      : null;

  const driverOut = assignedDriver
    ? {
        id: assignedDriver.id,
        name: assignedDriver.name,
        phone: assignedDriver.phone,
        profilePhoto: assignedDriver.profilePhoto,
        slug: (assignedDriver as any).slug ?? null,
        liveLocation,
      }
    : null;

  const booking = {
    bookingNumber: row.bookingNumber,
    status: row.status,
    serviceType: row.serviceType,
    vehicleType: row.vehicleType,
    pickupDate: row.pickupDate,
    returnDate: row.returnDate,
    pickupLocation: row.pickupLocation,
    dropLocation: row.dropLocation,
    notes: row.notes,
    paymentStatus: row.paymentStatus,
    totalAmount: row.totalAmount,
    paidAmount: row.paidAmount,
    bookingSource: row.bookingSource,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    assignedDriver: driverOut,
    assignedVehicle: assignedVehicle ? {
      id: assignedVehicle.id,
      vehicleName: assignedVehicle.vehicleName,
      registrationNumber: assignedVehicle.registrationNumber,
      color: assignedVehicle.color,
      fuelType: assignedVehicle.fuelType,
      seatingCapacity: assignedVehicle.seatingCapacity,
      images: vehicleImages,
    } : null,
    vendor: {
      businessName: row.businessName,
      city: row.city,
      phone: row.vendorPhone,
      logo: row.logo,
      slug: row.slug,
    },
  };

  return NextResponse.json({ booking });
}
