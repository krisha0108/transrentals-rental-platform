import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getDriver } from '@/lib/auth/driver-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// Drivers come in two flavours — vendor_staff (employed) and drivers
// (independent). getDriver() tells us which table to write the live fix to.
function modelFor(driver: any) {
  return (driver as any).userType === 'vendor_staff'
    ? prisma.vendor_staff
    : prisma.drivers;
}

// POST /api/driver/location
// The driver's browser pushes its current GPS fix here (every few seconds,
// driven by watchPosition on the portal). We keep only the latest fix on the
// driver row plus a timestamp; the vendor dashboard and the public track page
// poll it back. Pushing a fix implicitly turns sharing ON.
export async function POST(request: NextRequest) {
  try {
    const driver = await getDriver(request);
    if (!driver) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const lat = Number(body.lat);
    const lng = Number(body.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return NextResponse.json({ success: false, error: 'Invalid coordinates' }, { status: 400 });
    }

    const heading = Number.isFinite(Number(body.heading)) ? Number(body.heading) : null;
    const speed = Number.isFinite(Number(body.speed)) ? Number(body.speed) : null;
    const accuracy = Number.isFinite(Number(body.accuracy)) ? Number(body.accuracy) : null;

    await (modelFor(driver) as any).update({
      where: { id: driver.id },
      data: {
        currentLat: lat,
        currentLng: lng,
        currentHeading: heading,
        currentSpeed: speed,
        locationAccuracy: accuracy,
        locationUpdatedAt: new Date(),
        isSharingLocation: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Driver location update failed', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update location' },
      { status: 500 },
    );
  }
}

// DELETE /api/driver/location — stop sharing (driver toggled off / trip ended).
// We flip the flag rather than wiping coordinates so the "last seen" point
// stays available, but consumers must treat isSharingLocation=false as offline.
export async function DELETE(request: NextRequest) {
  try {
    const driver = await getDriver(request);
    if (!driver) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    await (modelFor(driver) as any).update({
      where: { id: driver.id },
      data: { isSharingLocation: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Driver location stop failed', error);
    return NextResponse.json(
      { success: false, error: 'Failed to stop sharing' },
      { status: 500 },
    );
  }
}

// GET /api/driver/location — driver reads back their own sharing state
// (so the portal toggle reflects reality after a refresh).
export async function GET(request: NextRequest) {
  try {
    const driver = await getDriver(request);
    if (!driver) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({
      success: true,
      isSharingLocation: (driver as any).isSharingLocation ?? false,
      currentLat: (driver as any).currentLat ?? null,
      currentLng: (driver as any).currentLng ?? null,
      locationUpdatedAt: (driver as any).locationUpdatedAt ?? null,
    });
  } catch (error: any) {
    logger.error('Driver location read failed', error);
    return NextResponse.json({ success: false, error: 'Failed to read location' }, { status: 500 });
  }
}
