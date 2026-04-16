// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/vendor/dashboard/quote-counts
 * Returns today's PENDING quote request counts per service for this vendor —
 * only requests where this vendor has NOT yet submitted a quote.
 *
 * - 7 services: today's open quote requests in vendor's approved locations
 *   where vendor hasn't quoted yet (none filter on quotes relation).
 * - Car Rental: today's BROADCASTED bookings vendor hasn't accepted yet.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: {
        vendor_approved_locations: { select: { locationId: true } },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const approvedLocationIds = vendor.vendor_approved_locations.map((l) => l.locationId);
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Base: open today in vendor's locations, vendor hasn't quoted yet
    const base = {
      createdAt: { gte: todayStart },
      status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
      locationId: { in: approvedLocationIds },
    };

    // Batch 1
    const [bikeCount, selfDriveCount, busCount, truckCount] = await Promise.all([
      prisma.bike_quote_requests.count({
        where: {
          ...base,
          bike_quotes_bike_quotes_requestIdTobike_quote_requests: {
            none: { vendorId },
          },
        },
      }).catch(() => 0),

      prisma.self_drive_quote_requests.count({
        where: {
          ...base,
          self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: {
            none: { vendorId },
          },
        },
      }).catch(() => 0),

      prisma.bus_quote_requests.count({
        where: {
          ...base,
          bus_quotes_bus_quotes_requestIdTobus_quote_requests: {
            none: { vendorId },
          },
        },
      }).catch(() => 0),

      prisma.truck_quote_requests.count({
        where: {
          ...base,
          truck_quotes: { none: { vendorId } },
        },
      }).catch(() => 0),
    ]);

    // Batch 2
    const [luxuryCount, packersCount, equipmentCount, carCount] = await Promise.all([
      prisma.luxury_quote_requests.count({
        where: {
          ...base,
          luxury_quotes: { none: { vendorId } },
        },
      }).catch(() => 0),

      prisma.packers_quote_requests.count({
        where: {
          ...base,
          packers_quotes: { none: { vendorId } },
        },
      }).catch(() => 0),

      prisma.equipment_quote_requests.count({
        where: {
          ...base,
          equipment_quotes: { none: { vendorId } },
        },
      }).catch(() => 0),

      // Car rental: BROADCASTED = no vendor accepted yet
      prisma.car_bookings.count({
        where: {
          createdAt: { gte: todayStart },
          status: 'BROADCASTED',
          locationId: { in: approvedLocationIds },
        },
      }).catch(() => 0),
    ]);

    return NextResponse.json({
      success: true,
      counts: {
        bike:         bikeCount,
        'self-drive': selfDriveCount,
        bus:          busCount,
        truck:        truckCount,
        luxury:       luxuryCount,
        packers:      packersCount,
        equipment:    equipmentCount,
        car:          carCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch quote counts', details: error?.message },
      { status: 500 }
    );
  }
}
