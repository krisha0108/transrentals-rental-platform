import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { STATIC_PAGES } from '@/lib/seo/service-meta-templates';
import { SERVICE_PARENT_MAP } from '@/lib/constants/service-mapping';

export const dynamic = 'force-dynamic';

// Build a map: parentSlug → number of public sub-service slugs
// Exclude nested paths like 'bike-trips/ladakh'
const SUB_SERVICE_COUNT: Record<string, number> = {};
for (const [childSlug, parentSlug] of Object.entries(SERVICE_PARENT_MAP)) {
  if (!childSlug.includes('/')) {
    SUB_SERVICE_COUNT[parentSlug] = (SUB_SERVICE_COUNT[parentSlug] || 0) + 1;
  }
}

export async function GET() {
  try {
    // All parent services with location counts
    const services = await prisma.services.findMany({
      where: { parentId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        displayOrder: true,
        _count: {
          select: {
            service_locations: { where: { isActive: true } },
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Route pairs (non-airport) → 2 pages each (one-way + round-trip)
    const nonAirportRoutes = await prisma.chauffeur_route_packages.findMany({
      where: {
        isActive: true,
        AND: [
          { locations_chauffeur_route_packages_fromLocationIdTolocations: { type: { not: 'AIRPORT' } } },
          { locations_chauffeur_route_packages_toLocationIdTolocations: { type: { not: 'AIRPORT' } } },
        ],
      },
      select: { fromLocationId: true, toLocationId: true },
      distinct: ['fromLocationId', 'toLocationId'],
    });

    // Airport transfer pairs
    const airportRoutes = await prisma.chauffeur_route_packages.findMany({
      where: {
        isActive: true,
        OR: [
          { locations_chauffeur_route_packages_fromLocationIdTolocations: { type: 'AIRPORT' } },
          { locations_chauffeur_route_packages_toLocationIdTolocations: { type: 'AIRPORT' } },
        ],
      },
      select: { fromLocationId: true, toLocationId: true },
      distinct: ['fromLocationId', 'toLocationId'],
    });

    const routePageCount = nonAirportRoutes.length * 2; // one-way + round-trip per pair
    const airportPageCount = airportRoutes.length * 2; // both directions

    const serviceStats = services.map((s) => {
      const rawLocationCount = s._count.service_locations;
      // Multiply by number of public sub-service slugs that share this parent's locations
      const subCount = SUB_SERVICE_COUNT[s.slug] || 1;
      const locationCount = rawLocationCount * subCount;
      // Route pages belong to car-rental-with-driver (its sub-services include one-way-cab, round-trip, airport-transfer)
      const routeCount = s.slug === 'car-rental-with-driver' ? routePageCount : 0;
      const airportCount = s.slug === 'car-rental-with-driver' ? airportPageCount : 0;
      return {
        id: s.id,
        name: s.name,
        slug: s.slug,
        icon: s.icon,
        locationCount,
        routeCount,
        airportCount,
        total: locationCount + routeCount + airportCount,
      };
    });

    const totalServicePages = serviceStats.reduce((sum, s) => sum + s.total, 0);
    const staticCount = STATIC_PAGES.length;

    return NextResponse.json({
      totalPages: totalServicePages + staticCount,
      totalServicePages,
      staticCount,
      services: serviceStats,
    });
  } catch (error) {
    console.error('[seo/overview GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
