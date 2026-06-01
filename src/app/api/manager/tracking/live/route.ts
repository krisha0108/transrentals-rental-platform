import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { resolveAssetUrl } from '@/lib/utils';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const STALE_MS = 2 * 60 * 1000;

function deriveStatus(d: any): 'moving' | 'idle' | 'offline' {
  if (!d.isSharingLocation || !d.locationUpdatedAt) return 'offline';
  if (Date.now() - new Date(d.locationUpdatedAt).getTime() > STALE_MS) return 'offline';
  return (d.currentSpeed ?? 0) > 1.4 ? 'moving' : 'idle';
}

// Vendors have no GPS — they're plotted at their city's coordinates. A
// deterministic per-vendor jitter (~±2km) keeps multiple vendors in the same
// city from stacking on one point.
function jitter(seed: string, lat: number, lng: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0x7fffffff;
  const dLat = ((h % 1000) / 1000 - 0.5) * 0.04;
  const dLng = (((h >> 10) % 1000) / 1000 - 0.5) * 0.04;
  return { lat: lat + dLat, lng: lng + dLng };
}

// GET /api/manager/tracking/live
// Manager-scoped live tracking: every driver (live GPS) and vendor (at city
// coords) within the manager's assigned locations. Powers /manager/tracking.
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: { manager_locations: { include: { locations: true } } },
    });
    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    // All assigned cities by NAME. Coords are OPTIONAL — used only to center
    // vendor pins on the map. (Previously cityNames was built only from cities
    // that HAD coords, so on a DB where locations lack lat/lng the manager saw
    // nothing. Scoping must never depend on coords.)
    const coordsByCity = new Map<string, { lat: number; lng: number }>();
    const cityNameSet = new Set<string>();
    for (const ml of manager.manager_locations) {
      const l = ml.locations;
      if (!l?.name) continue;
      cityNameSet.add(l.name);
      if (l.latitude != null && l.longitude != null && !coordsByCity.has(l.name)) {
        coordsByCity.set(l.name, { lat: l.latitude, lng: l.longitude });
      }
    }
    const cityNames = Array.from(cityNameSet);

    if (cityNames.length === 0) {
      return NextResponse.json({ success: true, vendors: [], drivers: [], stats: { vendors: 0, drivers: 0, driversLive: 0 } });
    }

    // Vendors in scope
    const vendorRows = await prisma.vendors.findMany({
      where: { city: { in: cityNames } },
      select: { id: true, businessName: true, city: true, status: true, logo: true, slug: true },
    });
    const vendorIds = vendorRows.map((v) => v.id);

    // Driver counts per vendor + ALL vendor-staff drivers + ALL active
    // independent drivers — regardless of whether GPS is on/off. Offline
    // drivers list mein dikhte hain par map pe nahi (frontend lat/lng null
    // wale ko skip karta hai). `deriveStatus` null lat/lng / stale update
    // ko 'offline' batata hai.
    const [driverCounts, driverRows, indieRows] = await Promise.all([
      prisma.vendor_staff.groupBy({
        by: ['vendorId'],
        where: { vendorId: { in: vendorIds }, role: 'DRIVER' },
        _count: { _all: true },
      }),
      prisma.vendor_staff.findMany({
        where: { vendorId: { in: vendorIds }, role: 'DRIVER' },
        select: {
          id: true, name: true, phone: true, profilePhoto: true, vendorId: true,
          isSharingLocation: true, currentLat: true, currentLng: true, currentHeading: true,
          currentSpeed: true, locationUpdatedAt: true,
          vendors: { select: { businessName: true, city: true } },
        },
      }),
      // Independent drivers aren't tied to a vendor/city — platform-wide,
      // shown whether GPS is on or off.
      prisma.drivers.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true, name: true, phone: true, profilePhoto: true,
          isSharingLocation: true, currentLat: true, currentLng: true, currentHeading: true,
          currentSpeed: true, locationUpdatedAt: true,
        },
      }),
    ]);
    const countByVendor = new Map(driverCounts.map((c) => [c.vendorId, c._count._all]));

    // Include ALL in-scope vendors in the list. Only those whose city has
    // coords get a map position (lat/lng); the rest are null (list-only).
    const vendors = vendorRows.map((v) => {
      const base = v.city ? coordsByCity.get(v.city) : undefined;
      const pos = base ? jitter(v.id, base.lat, base.lng) : null;
      return {
        id: v.id,
        name: v.businessName,
        city: v.city,
        status: v.status,
        logo: v.logo ? resolveAssetUrl(v.logo) : null,
        slug: v.slug,
        driverCount: countByVendor.get(v.id) || 0,
        lat: pos ? pos.lat : null,
        lng: pos ? pos.lng : null,
      };
    });

    const mapDriver = (d: any, vendorName: string | null, independent: boolean) => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      profilePhoto: d.profilePhoto ? resolveAssetUrl(d.profilePhoto) : null,
      vendorName,
      city: d.vendors?.city ?? null,
      independent,
      status: deriveStatus(d),
      speed: d.currentSpeed != null ? Math.round(d.currentSpeed * 3.6) : 0,
      heading: d.currentHeading ?? 0,
      lat: d.currentLat,
      lng: d.currentLng,
      updatedAt: d.locationUpdatedAt,
    });

    const drivers = [
      ...driverRows.map((d) => mapDriver(d, d.vendors?.businessName ?? null, false)),
      ...indieRows.map((d) => mapDriver(d, 'Independent', true)),
    ];

    return NextResponse.json({
      success: true,
      vendors,
      drivers,
      stats: {
        vendors: vendors.length,
        drivers: drivers.length,
        vendorDrivers: drivers.filter((d) => !d.independent).length,
        independentDrivers: drivers.filter((d) => d.independent).length,
        driversLive: drivers.filter((d) => d.status !== 'offline').length,
      },
    });
  } catch (error: any) {
    logger.error('Manager live tracking fetch failed', error);
    return NextResponse.json({ error: 'Failed to load tracking' }, { status: 500 });
  }
}
