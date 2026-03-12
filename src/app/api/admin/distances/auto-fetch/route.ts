import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/distances/auto-fetch?from=locationId&to=locationId
 *
 * Priority:
 * 1. Try OSRM API (free, open-source routing using lat/lon)
 * 2. Fallback: check our DB (city_distance_matrix)
 * 3. Not available — let admin enter manually
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromLocationId = searchParams.get('from');
    const toLocationId = searchParams.get('to');

    if (!fromLocationId || !toLocationId) {
      return NextResponse.json(
        { success: false, error: 'Both from and to location IDs are required' },
        { status: 400 }
      );
    }

    if (fromLocationId === toLocationId) {
      return NextResponse.json(
        { success: false, error: 'From and To locations must be different' },
        { status: 400 }
      );
    }

    // Fetch both locations (need lat/lon for OSRM)
    const [fromLoc, toLoc] = await Promise.all([
      prisma.locations.findUnique({
        where: { id: fromLocationId },
        select: { id: true, name: true, latitude: true, longitude: true },
      }),
      prisma.locations.findUnique({
        where: { id: toLocationId },
        select: { id: true, name: true, latitude: true, longitude: true },
      }),
    ]);

    if (!fromLoc || !toLoc) {
      return NextResponse.json(
        { success: false, error: 'One or both locations not found' },
        { status: 404 }
      );
    }

    // ─────────────────────────────────────────────────
    // Helper: geocode a city name → lat/lon via Nominatim (free, no API key)
    // ─────────────────────────────────────────────────
    async function geocodeCity(name: string): Promise<{ lat: number; lon: number } | null> {
      try {
        const query = encodeURIComponent(`${name}, India`);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=in`;
        const res = await fetch(url, {
          signal: AbortSignal.timeout(6000),
          headers: { 'User-Agent': 'TransRentals-Admin/1.0 (contact@transrentals.in)' },
        });
        if (!res.ok) return null;
        const results = await res.json();
        if (!results?.length) return null;
        return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) };
      } catch {
        return null;
      }
    }

    // ─────────────────────────────────────────────────
    // STEP 1: Resolve coordinates — use stored or geocode by name
    // ─────────────────────────────────────────────────
    let fromCoords = (fromLoc.latitude && fromLoc.longitude)
      ? { lat: fromLoc.latitude, lon: fromLoc.longitude }
      : await geocodeCity(fromLoc.name);

    let toCoords = (toLoc.latitude && toLoc.longitude)
      ? { lat: toLoc.latitude, lon: toLoc.longitude }
      : await geocodeCity(toLoc.name);

    // ─────────────────────────────────────────────────
    // STEP 2: Try OSRM if we have coordinates for both
    // ─────────────────────────────────────────────────
    if (fromCoords && toCoords) {
      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromCoords.lon},${fromCoords.lat};${toCoords.lon},${toCoords.lat}?overview=false&annotations=false`;

        const osrmRes = await fetch(osrmUrl, {
          signal: AbortSignal.timeout(8000),
          headers: { 'User-Agent': 'TransRentals-Admin/1.0' },
        });

        if (osrmRes.ok) {
          const osrmData = await osrmRes.json();

          if (osrmData.code === 'Ok' && osrmData.routes?.length > 0) {
            const route = osrmData.routes[0];
            const distanceKm = Math.round(route.distance / 1000);
            const durationMinutes = Math.round(route.duration / 60);
            const hours = Math.floor(durationMinutes / 60);
            const mins = durationMinutes % 60;
            const durationText = hours > 0
              ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`)
              : `${mins}m`;

            // Flag if coordinates came from geocoding (not stored in DB)
            const geocoded = !fromLoc.latitude || !fromLoc.longitude || !toLoc.latitude || !toLoc.longitude;

            return NextResponse.json({
              success: true,
              source: 'osrm',
              sourceLabel: geocoded ? 'OSRM via city name lookup' : 'OSRM (OpenStreetMap)',
              fromLocation: { id: fromLoc.id, name: fromLoc.name },
              toLocation: { id: toLoc.id, name: toLoc.name },
              distance: { distanceKm, durationMinutes, durationText },
            });
          }
        }
      } catch (osrmError: any) {
        console.warn('OSRM failed:', osrmError?.message);
      }
    }

    // ─────────────────────────────────────────────────
    // STEP 3: Fallback — check our DB
    // ─────────────────────────────────────────────────
    const dbDistance = await prisma.city_distance_matrix.findFirst({
      where: {
        OR: [
          { fromLocationId, toLocationId },
          { fromLocationId: toLocationId, toLocationId: fromLocationId },
        ],
        isActive: true,
      },
    });

    if (dbDistance) {
      return NextResponse.json({
        success: true,
        source: 'database',
        sourceLabel: 'Saved in Database',
        fromLocation: { id: fromLoc.id, name: fromLoc.name },
        toLocation: { id: toLoc.id, name: toLoc.name },
        distance: {
          distanceKm: dbDistance.distanceKm,
          durationMinutes: dbDistance.durationMinutes,
          durationText: dbDistance.durationText,
          routeVia: dbDistance.routeVia,
          tollEstimate: dbDistance.tollEstimate ? Number(dbDistance.tollEstimate) : null,
          statePermit: dbDistance.statePermit,
          isVerified: dbDistance.isVerified,
        },
      });
    }

    // ─────────────────────────────────────────────────
    // STEP 4: Nothing worked — let admin enter manually
    // ─────────────────────────────────────────────────
    const geocodeFailed = !fromCoords || !toCoords;
    return NextResponse.json({
      success: false,
      source: 'none',
      error: 'Distance not available',
      reason: geocodeFailed
        ? `Could not find coordinates for ${!fromCoords ? fromLoc.name : toLoc.name} — try entering the distance manually.`
        : 'OSRM could not calculate this route and no saved distance found. Please enter manually.',
      fromLocation: { id: fromLoc.id, name: fromLoc.name },
      toLocation: { id: toLoc.id, name: toLoc.name },
    }, { status: 404 });

  } catch (error: any) {
    logger.error('Auto-fetch distance failed', error);
    return NextResponse.json(
      { success: false, error: 'Failed to auto-fetch distance', details: error?.message },
      { status: 500 }
    );
  }
}
