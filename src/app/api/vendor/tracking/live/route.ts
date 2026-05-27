import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// A fix older than this is treated as stale → driver shown "offline" even if
// the sharing flag is still on (e.g. browser closed without a clean stop).
const STALE_MS = 2 * 60 * 1000;
// Active trips are the ones worth tracking on a live map.
const ACTIVE_TRIP_STATUSES = ['confirmed', 'in_progress'];

function deriveStatus(driver: any): 'moving' | 'idle' | 'offline' {
  if (!driver.isSharingLocation || !driver.locationUpdatedAt) return 'offline';
  if (Date.now() - new Date(driver.locationUpdatedAt).getTime() > STALE_MS) return 'offline';
  // currentSpeed is m/s from the Geolocation API; ~1.4 m/s ≈ walking pace.
  return (driver.currentSpeed ?? 0) > 1.4 ? 'moving' : 'idle';
}

// GET /api/vendor/tracking/live
// Returns every DRIVER on the vendor's roster with their latest known fix and,
// if they're on a confirmed/in-progress trip, the trip + assigned vehicle.
// The vendor tracking dashboard polls this every few seconds.
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ success: false, error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const [staff, activeTrips] = await Promise.all([
      prisma.vendor_staff.findMany({
        where: { vendorId, role: 'DRIVER' },
        select: {
          id: true, name: true, phone: true, profilePhoto: true,
          isSharingLocation: true, currentLat: true, currentLng: true,
          currentHeading: true, currentSpeed: true, locationAccuracy: true,
          locationUpdatedAt: true,
        },
      }),
      prisma.vendor_direct_bookings.findMany({
        where: {
          vendorId,
          assignedDriverId: { not: null },
          status: { in: ACTIVE_TRIP_STATUSES },
        },
        select: {
          bookingNumber: true, customerName: true, status: true,
          pickupLocation: true, dropLocation: true, assignedAt: true,
          assignedDriverId: true,
          assignedVehicle: {
            select: { id: true, vehicleName: true, registrationNumber: true, color: true },
          },
        },
        orderBy: { assignedAt: 'desc' },
      }),
    ]);

    // First active trip per driver wins (most recently assigned).
    const tripByDriver = new Map<string, (typeof activeTrips)[number]>();
    for (const t of activeTrips) {
      if (t.assignedDriverId && !tripByDriver.has(t.assignedDriverId)) {
        tripByDriver.set(t.assignedDriverId, t);
      }
    }

    const drivers = staff.map((d) => {
      const status = deriveStatus(d);
      const trip = tripByDriver.get(d.id);
      const hasFix = d.currentLat != null && d.currentLng != null;
      return {
        id: d.id,
        name: d.name,
        phone: d.phone,
        profilePhoto: d.profilePhoto,
        status,
        isSharingLocation: d.isSharingLocation,
        speed: d.currentSpeed != null ? Math.round(d.currentSpeed * 3.6) : 0, // m/s → km/h
        heading: d.currentHeading ?? 0,
        location: hasFix
          ? {
              lat: d.currentLat,
              lng: d.currentLng,
              accuracy: d.locationAccuracy,
              updatedAt: d.locationUpdatedAt,
            }
          : null,
        vehicle: trip?.assignedVehicle
          ? {
              id: trip.assignedVehicle.id,
              name: trip.assignedVehicle.vehicleName,
              number: trip.assignedVehicle.registrationNumber,
              color: trip.assignedVehicle.color,
            }
          : null,
        currentTrip: trip
          ? {
              bookingNumber: trip.bookingNumber,
              customer: trip.customerName,
              from: trip.pickupLocation,
              to: trip.dropLocation,
              status: trip.status,
              startedAt: trip.assignedAt,
            }
          : null,
      };
    });

    const stats = {
      total: drivers.length,
      sharing: drivers.filter((d) => d.isSharingLocation).length,
      moving: drivers.filter((d) => d.status === 'moving').length,
      idle: drivers.filter((d) => d.status === 'idle').length,
      offline: drivers.filter((d) => d.status === 'offline').length,
      onTrip: drivers.filter((d) => d.currentTrip).length,
    };

    return NextResponse.json({ success: true, drivers, stats });
  } catch (error: any) {
    logger.error('Vendor live tracking fetch failed', error);
    return NextResponse.json({ success: false, error: 'Failed to load live tracking' }, { status: 500 });
  }
}
