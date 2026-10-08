// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { isVendorServiceActive } from '@/lib/services/vendor-service-status';

export const dynamic = 'force-dynamic';

// Recent open quote requests for the vendor dashboard — quote-based services
// ONLY (bike, self-drive, bus, truck, luxury, packers, equipment). Car
// rental is a direct-booking flow (BROADCASTED bookings, not quote
// requests) and is intentionally excluded here — that surfaces elsewhere.
//
// "Open" mirrors /api/vendor/dashboard/quote-counts: PENDING/QUOTES_RECEIVED
// requests in the vendor's approved locations that this vendor hasn't
// already quoted on — i.e. real, still-actionable opportunities, not a
// history log.
const PER_SERVICE_LIMIT = 5;
const TOTAL_LIMIT = 8;

export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const vendor = await prisma.vendors.findFirst({
      where: { id: vendorId },
      select: { vendor_approved_locations: { where: { isActive: true }, select: { locationId: true } } },
    });
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }
    const approvedLocationIds = vendor.vendor_approved_locations.map((l) => l.locationId);

    const base = {
      status: { in: ['PENDING', 'QUOTES_RECEIVED'] },
      locationId: { in: approvedLocationIds },
    };

    // A vendor who's deactivated a service on /vendor/services must not see
    // "new opportunity" cards for it here — skip the query entirely.
    const [bikeActive, selfDriveActive, busActive, truckActive, luxuryActive, packersActive, equipmentActive] = await Promise.all([
      isVendorServiceActive(vendorId, 'bike'),
      isVendorServiceActive(vendorId, 'self-drive'),
      isVendorServiceActive(vendorId, 'bus'),
      isVendorServiceActive(vendorId, 'truck'),
      isVendorServiceActive(vendorId, 'luxury'),
      isVendorServiceActive(vendorId, 'packers'),
      isVendorServiceActive(vendorId, 'equipment'),
    ]);

    const [bike, selfDrive, bus, truck, luxury, packers, equipment] = await Promise.all([
      !bikeActive ? [] : prisma.bike_quote_requests.findMany({
        where: { ...base, bike_quotes_bike_quotes_requestIdTobike_quote_requests: { none: { vendorId } } },
        select: { id: true, requestNumber: true, customerName: true, locationName: true, pickupDate: true, budgetMin: true, budgetMax: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: PER_SERVICE_LIMIT,
      }).catch(() => []),

      !selfDriveActive ? [] : prisma.self_drive_quote_requests.findMany({
        where: { ...base, self_drive_quotes_self_drive_quotes_requestIdToself_drive_quote_requests: { none: { vendorId } } },
        select: { id: true, requestNumber: true, customerName: true, locationName: true, pickupDate: true, budgetMin: true, budgetMax: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: PER_SERVICE_LIMIT,
      }).catch(() => []),

      !busActive ? [] : prisma.bus_quote_requests.findMany({
        where: { ...base, bus_quotes_bus_quotes_requestIdTobus_quote_requests: { none: { vendorId } } },
        select: { id: true, requestNumber: true, customerName: true, pickupDate: true, budgetMin: true, budgetMax: true, createdAt: true, locations: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: PER_SERVICE_LIMIT,
      }).catch(() => []),

      !truckActive ? [] : prisma.truck_quote_requests.findMany({
        where: { ...base, truck_quotes: { none: { vendorId } } },
        select: { id: true, requestNumber: true, customerName: true, pickupDate: true, budgetMin: true, budgetMax: true, createdAt: true, locations: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: PER_SERVICE_LIMIT,
      }).catch(() => []),

      !luxuryActive ? [] : prisma.luxury_quote_requests.findMany({
        where: { ...base, luxury_quotes: { none: { vendorId } } },
        select: { id: true, requestNumber: true, customerName: true, pickupDate: true, budgetMin: true, budgetMax: true, createdAt: true, locations: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: PER_SERVICE_LIMIT,
      }).catch(() => []),

      !packersActive ? [] : prisma.packers_quote_requests.findMany({
        where: { ...base, packers_quotes: { none: { vendorId } } },
        select: { id: true, requestNumber: true, customerName: true, pickupCity: true, preferredDate: true, budgetMin: true, budgetMax: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: PER_SERVICE_LIMIT,
      }).catch(() => []),

      !equipmentActive ? [] : prisma.equipment_quote_requests.findMany({
        where: { ...base, equipment_quotes: { none: { vendorId } } },
        select: { id: true, requestNumber: true, customerName: true, deliveryCity: true, startDate: true, budgetMin: true, budgetMax: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: PER_SERVICE_LIMIT,
      }).catch(() => []),
    ]);

    const normalize = (rows: any[], service: string, opts: { location: (r: any) => string | null; date: (r: any) => Date; href: string }) =>
      rows.map((r) => ({
        id: r.id,
        service,
        requestNumber: r.requestNumber,
        customerName: r.customerName,
        location: opts.location(r) || null,
        eventDate: opts.date(r),
        budgetMin: r.budgetMin ?? null,
        budgetMax: r.budgetMax ?? null,
        createdAt: r.createdAt,
        href: opts.href,
      }));

    const requests = [
      ...normalize(bike, 'bike', { location: (r) => r.locationName, date: (r) => r.pickupDate, href: '/vendor/bike-rentals/requests' }),
      ...normalize(selfDrive, 'self-drive', { location: (r) => r.locationName, date: (r) => r.pickupDate, href: '/vendor/self-drive/requests' }),
      ...normalize(bus, 'bus', { location: (r) => r.locations?.name, date: (r) => r.pickupDate, href: '/vendor/bus/requests' }),
      ...normalize(truck, 'truck', { location: (r) => r.locations?.name, date: (r) => r.pickupDate, href: '/vendor/truck/requests' }),
      ...normalize(luxury, 'luxury', { location: (r) => r.locations?.name, date: (r) => r.pickupDate, href: '/vendor/luxury/bookings' }),
      ...normalize(packers, 'packers', { location: (r) => r.pickupCity, date: (r) => r.preferredDate, href: '/vendor/packers/requests' }),
      ...normalize(equipment, 'equipment', { location: (r) => r.deliveryCity, date: (r) => r.startDate, href: '/vendor/equipment/requests' }),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, TOTAL_LIMIT);

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch recent quote requests', details: error?.message },
      { status: 500 }
    );
  }
}
