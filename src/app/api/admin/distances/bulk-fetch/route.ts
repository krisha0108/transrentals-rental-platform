import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import crypto from 'crypto';
import { authorizeCarRentalContentAccess } from '@/lib/auth/car-rental-content-access';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 min — geocoding + OSRM can take time

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Geocode a city name via Nominatim (free, no API key) */
async function geocodeCity(name: string, stateName?: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const query = encodeURIComponent(stateName ? `${name}, ${stateName}, India` : `${name}, India`);
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

/** Load all service cities for a given state name */
async function loadCitiesForState(serviceId: string, stateName: string) {
  const stateRecord = await prisma.locations.findFirst({
    where: {
      name: { equals: stateName },
      type: { in: ['STATE', 'UNION_TERRITORY'] as any },
    },
    select: { id: true, name: true },
  });

  const serviceLocations = await prisma.service_locations.findMany({
    where: {
      serviceId,
      isActive: true,
      locations: {
        isActive: true,
        type: { in: ['CITY', 'VILLAGE'] as any[] },
        ...(stateRecord
          ? { parentId: stateRecord.id }
          : { locations: { name: { equals: stateName } } }),
      },
    },
    include: {
      locations: {
        select: { id: true, name: true, latitude: true, longitude: true },
      },
    },
  });

  return serviceLocations.map((sl) => sl.locations).filter(Boolean) as {
    id: string; name: string; latitude: number | null; longitude: number | null;
  }[];
}

/** Resolve coordinates for a list of cities — use stored or geocode via Nominatim */
async function resolveCoords(
  cities: { id: string; name: string; latitude: number | null; longitude: number | null }[],
  stateName: string,
  coordsMap: Map<string, { lat: number; lon: number }>,
  geocodedList: string[],
  failedList: string[],
) {
  for (const city of cities) {
    if (coordsMap.has(city.id)) continue; // already resolved (shared between states)
    if (city.latitude && city.longitude) {
      coordsMap.set(city.id, { lat: city.latitude, lon: city.longitude });
    } else {
      const coords = await geocodeCity(city.name, stateName);
      if (coords) {
        coordsMap.set(city.id, coords);
        geocodedList.push(city.name);
      } else {
        failedList.push(city.name);
      }
      await sleep(1100); // respect Nominatim 1 req/sec rate limit
    }
  }
}

/**
 * POST /api/admin/distances/bulk-fetch
 *
 * Body:
 *   mode: 'intra' | 'inter'
 *   stateName: string          (for intra)
 *   stateNameA: string         (for inter — source state)
 *   stateNameB: string         (for inter — destination state)
 *   serviceSlug: string
 *   overwrite?: boolean
 *   createReverse?: boolean    (for intra: create B→A too; for inter: always true — A→B and B→A)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      mode = 'intra',
      stateName,
      stateNameA,
      stateNameB,
      serviceSlug,
      overwrite = false,
      createReverse = true,
    } = body;

    if (!serviceSlug) {
      return NextResponse.json({ success: false, error: 'serviceSlug is required' }, { status: 400 });
    }

    const access = await authorizeCarRentalContentAccess(serviceSlug);
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    }

    const isInter = mode === 'inter';

    if (isInter && (!stateNameA || !stateNameB)) {
      return NextResponse.json({ success: false, error: 'stateNameA and stateNameB are required for inter-state mode' }, { status: 400 });
    }
    if (!isInter && !stateName) {
      return NextResponse.json({ success: false, error: 'stateName is required for intra-state mode' }, { status: 400 });
    }
    if (isInter && stateNameA === stateNameB) {
      return NextResponse.json({ success: false, error: 'stateNameA and stateNameB must be different' }, { status: 400 });
    }

    // ── 1. Find service ──────────────────────────────
    const service = await prisma.services.findUnique({
      where: { slug: serviceSlug },
      select: { id: true },
    });
    if (!service) {
      return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 });
    }

    // ── 2. Load cities ───────────────────────────────
    const coordsMap = new Map<string, { lat: number; lon: number }>();
    const geocodedCities: string[] = [];
    const failedGeocoding: string[] = [];

    let citiesA: Awaited<ReturnType<typeof loadCitiesForState>>;
    let citiesB: Awaited<ReturnType<typeof loadCitiesForState>> = [];

    if (isInter) {
      [citiesA, citiesB] = await Promise.all([
        loadCitiesForState(service.id, stateNameA),
        loadCitiesForState(service.id, stateNameB),
      ]);
      if (citiesA.length === 0) return NextResponse.json({ success: false, error: `No cities found for "${stateNameA}" in this service` }, { status: 400 });
      if (citiesB.length === 0) return NextResponse.json({ success: false, error: `No cities found for "${stateNameB}" in this service` }, { status: 400 });
    } else {
      citiesA = await loadCitiesForState(service.id, stateName);
      if (citiesA.length < 2) return NextResponse.json({ success: false, error: `Only ${citiesA.length} city found for "${stateName}". Need at least 2.` }, { status: 400 });
    }

    // ── 3. Geocode missing coords ─────────────────────
    await resolveCoords(citiesA, isInter ? stateNameA : stateName, coordsMap, geocodedCities, failedGeocoding);
    if (isInter) {
      await resolveCoords(citiesB, stateNameB, coordsMap, geocodedCities, failedGeocoding);
    }

    const citiesAWithCoords = citiesA.filter((c) => coordsMap.has(c.id));
    const citiesBWithCoords = isInter ? citiesB.filter((c) => coordsMap.has(c.id)) : [];

    const allCities = isInter
      ? [...citiesAWithCoords, ...citiesBWithCoords]
      : citiesAWithCoords;

    if (allCities.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Not enough cities with coordinates to calculate routes.',
        geocodedCities, failedGeocoding,
      }, { status: 400 });
    }

    // ── 4. OSRM Routing ───────────────────────────────
    const coordString = allCities
      .map((c) => { const { lat, lon } = coordsMap.get(c.id)!; return `${lon},${lat}`; })
      .join(';');

    let distanceMatrix: number[][] = [];
    let durationMatrix: number[][] = [];
    let osrmError = '';

    // Try OSRM Table API (fast — one request for all pairs)
    async function tryTableApi(): Promise<boolean> {
      try {
        let osrmUrl: string;
        if (isInter) {
          const sourceIndices = citiesAWithCoords.map((_, i) => i).join(',');
          const destIndices = citiesBWithCoords.map((_, i) => citiesAWithCoords.length + i).join(',');
          osrmUrl = `https://router.project-osrm.org/table/v1/driving/${coordString}?sources=${sourceIndices}&destinations=${destIndices}&annotations=distance,duration`;
        } else {
          osrmUrl = `https://router.project-osrm.org/table/v1/driving/${coordString}?annotations=distance,duration`;
        }

        const osrmRes = await fetch(osrmUrl, {
          signal: AbortSignal.timeout(30000),
          headers: { 'User-Agent': 'TransRentals-Admin/1.0' },
        });

        if (!osrmRes.ok) {
          osrmError = `HTTP ${osrmRes.status}`;
          return false;
        }
        const osrmData = await osrmRes.json();
        if (osrmData.code === 'Ok') {
          distanceMatrix = osrmData.distances || [];
          durationMatrix = osrmData.durations || [];
          return true;
        }
        osrmError = osrmData.code || 'Unknown error';
        return false;
      } catch (err: any) {
        osrmError = err?.message || 'Timeout';
        return false;
      }
    }

    // Fallback: individual Route API calls (slower but more reliable)
    async function tryIndividualRoutes(): Promise<boolean> {
      const sourceCities = isInter ? citiesAWithCoords : citiesAWithCoords;
      const destCities   = isInter ? citiesBWithCoords : citiesAWithCoords;

      // Pre-fill matrices with 0
      distanceMatrix = sourceCities.map(() => destCities.map(() => 0));
      durationMatrix = sourceCities.map(() => destCities.map(() => 0));

      let anySuccess = false;
      const CONCURRENCY = 3;

      const pairs: [number, number][] = [];
      for (let i = 0; i < sourceCities.length; i++) {
        for (let j = 0; j < destCities.length; j++) {
          if (!isInter && i === j) continue;
          if (!isInter && i > j) continue; // only upper triangle; reverse saved in step 6
          pairs.push([i, j]);
        }
      }

      // Process in small concurrent batches
      for (let start = 0; start < pairs.length; start += CONCURRENCY) {
        const batch = pairs.slice(start, start + CONCURRENCY);
        await Promise.all(batch.map(async ([i, j]) => {
          const src = sourceCities[i];
          const dst = destCities[j];
          const { lat: slat, lon: slon } = coordsMap.get(src.id)!;
          const { lat: dlat, lon: dlon } = coordsMap.get(dst.id)!;
          try {
            const res = await fetch(
              `https://router.project-osrm.org/route/v1/driving/${slon},${slat};${dlon},${dlat}?overview=false`,
              { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'TransRentals-Admin/1.0' } }
            );
            if (res.ok) {
              const d = await res.json();
              if (d.code === 'Ok' && d.routes?.length) {
                distanceMatrix[i][j] = d.routes[0].distance;
                durationMatrix[i][j] = d.routes[0].duration;
                anySuccess = true;
              }
            }
          } catch { /* skip this pair */ }
        }));
        if (start + CONCURRENCY < pairs.length) await sleep(300); // small delay between batches
      }

      return anySuccess;
    }

    // Try Table API, retry once, then fall back to individual
    let ok = await tryTableApi();
    if (!ok) {
      console.warn(`OSRM Table failed (${osrmError}), retrying in 3s...`);
      await sleep(3000);
      ok = await tryTableApi();
    }
    if (!ok) {
      console.warn(`OSRM Table retry failed (${osrmError}), falling back to individual route calls...`);
      ok = await tryIndividualRoutes();
    }

    if (!ok || distanceMatrix.length === 0) {
      return NextResponse.json({
        success: false,
        error: `OSRM routing service failed (${osrmError}). Check that the cities have valid coordinates and try again.`,
        citiesResolved: allCities.length,
        geocodedCities, failedGeocoding,
      }, { status: 502 });
    }

    // ── 5. Check existing routes ─────────────────────
    const allCityIds = allCities.map((c) => c.id);
    const existingRoutes = overwrite
      ? new Set<string>()
      : await prisma.city_distance_matrix.findMany({
          where: {
            fromLocationId: { in: allCityIds },
            toLocationId: { in: allCityIds },
          },
          select: { fromLocationId: true, toLocationId: true },
        }).then((rows) => new Set(rows.map((r) => `${r.fromLocationId}:${r.toLocationId}`)));

    // ── 6. Save routes ────────────────────────────────
    let added = 0, skipped = 0;
    const errors: string[] = [];

    const sourceCities = isInter ? citiesAWithCoords : citiesAWithCoords;
    const destCities   = isInter ? citiesBWithCoords : citiesAWithCoords;

    type RouteRow = {
      id: string; fromLocationId: string; toLocationId: string;
      distanceKm: number; durationMinutes: number | null; durationText: string | null;
      source: string; isVerified: boolean; isActive: boolean; lastUpdated: Date;
    };

    const toCreate: RouteRow[] = [];
    const toUpdate: Omit<RouteRow, 'id' | 'source' | 'isVerified' | 'isActive'>[] = [];

    for (let i = 0; i < sourceCities.length; i++) {
      for (let j = 0; j < destCities.length; j++) {
        const fromCity = sourceCities[i];
        const toCity   = destCities[j];

        if (fromCity.id === toCity.id) continue;
        if (!isInter && !createReverse && i > j) continue;

        const rawDist = distanceMatrix[i]?.[j];
        const rawDur  = durationMatrix[i]?.[j];
        if (!rawDist || rawDist <= 0) continue;

        const distanceKm = Math.round(rawDist / 1000);
        const durationMinutes = rawDur ? Math.round(rawDur / 60) : null;
        const h = durationMinutes ? Math.floor(durationMinutes / 60) : 0;
        const m = durationMinutes ? durationMinutes % 60 : 0;
        const durationText = durationMinutes
          ? (h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`)
          : null;

        const pairs: [string, string][] = [[fromCity.id, toCity.id]];
        if (createReverse) pairs.push([toCity.id, fromCity.id]);

        for (const [fromId, toId] of pairs) {
          const key = `${fromId}:${toId}`;
          if (existingRoutes.has(key)) {
            if (overwrite) toUpdate.push({ fromLocationId: fromId, toLocationId: toId, distanceKm, durationMinutes, durationText, lastUpdated: new Date() });
            else skipped++;
          } else {
            toCreate.push({ id: generateId(), fromLocationId: fromId, toLocationId: toId, distanceKm, durationMinutes, durationText, source: 'osrm_bulk', isVerified: false, isActive: true, lastUpdated: new Date() });
          }
        }
      }
    }

    // Batch insert new routes — single DB call instead of N sequential upserts
    if (toCreate.length > 0) {
      try {
        const result = await prisma.city_distance_matrix.createMany({ data: toCreate, skipDuplicates: true });
        added += result.count;
      } catch (err: any) {
        errors.push(`Batch create failed: ${err.message}`);
      }
    }

    // Overwrite: update existing in parallel chunks of 50
    const CHUNK = 50;
    for (let start = 0; start < toUpdate.length; start += CHUNK) {
      await Promise.all(
        toUpdate.slice(start, start + CHUNK).map((r) =>
          prisma.city_distance_matrix.update({
            where: { fromLocationId_toLocationId: { fromLocationId: r.fromLocationId, toLocationId: r.toLocationId } },
            data: { distanceKm: r.distanceKm, durationMinutes: r.durationMinutes, durationText: r.durationText, source: 'osrm_bulk', lastUpdated: r.lastUpdated },
          }).catch((err: any) => errors.push(`Update failed: ${err.message}`))
        )
      );
      added += Math.min(CHUNK, toUpdate.length - start);
    }

    return NextResponse.json({
      success: true,
      mode,
      stateName: isInter ? `${stateNameA} ↔ ${stateNameB}` : stateName,
      summary: {
        citiesFound: isInter
          ? { [stateNameA]: citiesA.length, [stateNameB]: citiesB.length }
          : citiesA.length,
        citiesWithCoords: allCities.length,
        geocodedCities,
        failedGeocoding,
        routesAdded: added,
        routesSkipped: skipped,
        errors: errors.slice(0, 10),
      },
    });

  } catch (error: any) {
    logger.error('Bulk distance fetch failed', error);
    return NextResponse.json(
      { success: false, error: 'Bulk fetch failed', details: error?.message },
      { status: 500 }
    );
  }
}
