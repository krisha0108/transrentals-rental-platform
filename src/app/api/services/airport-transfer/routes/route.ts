import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Public endpoint to get airport transfer routes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;

    // Fetch active routes with airport locations
    const routes = await prisma.chauffeur_route_packages.findMany({
      where: {
        isActive: true,
        OR: [
          {
            locations_chauffeur_route_packages_fromLocationIdTolocations: {
              type: 'AIRPORT',
            },
          },
          {
            locations_chauffeur_route_packages_toLocationIdTolocations: {
              type: 'AIRPORT',
            },
          },
        ],
      },
      include: {
        locations_chauffeur_route_packages_fromLocationIdTolocations: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            code: true,
            locations: {
              select: {
                name: true,
              },
            },
          },
        },
        locations_chauffeur_route_packages_toLocationIdTolocations: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            code: true,
            locations: {
              select: {
                name: true,
              },
            },
          },
        },
        chauffeur_vehicle_categories: {
          select: {
            id: true,
            name: true,
            image: true,
            baseRate: true,
            seatingCapacity: true,
          },
        },
      },
      distinct: ['fromLocationId', 'toLocationId'],
      orderBy: [
        { isPopular: 'desc' },
        { fromLocationId: 'asc' },
      ],
      ...(limit ? { take: limit } : { take: 500 }),
    });

    // Group routes and calculate min prices
    const routeMap = new Map();

    routes.forEach((route) => {
      const fromLocation = route.locations_chauffeur_route_packages_fromLocationIdTolocations;
      const toLocation = route.locations_chauffeur_route_packages_toLocationIdTolocations;

      if (!fromLocation || !toLocation) return;

      const routeKey = `${fromLocation.slug}-to-${toLocation.slug}`;

      if (!routeMap.has(routeKey)) {
        // Determine if it's airport pickup or drop
        const isAirportPickup = fromLocation.type === 'AIRPORT';

        routeMap.set(routeKey, {
          fromLocation: {
            id: fromLocation.id,
            name: fromLocation.name,
            slug: fromLocation.slug,
            code: fromLocation.code,
            isAirport: fromLocation.type === 'AIRPORT',
          },
          toLocation: {
            id: toLocation.id,
            name: toLocation.name,
            slug: toLocation.slug,
            code: toLocation.code,
            isAirport: toLocation.type === 'AIRPORT',
          },
          distance: route.estimatedKm || 0,
          estimatedTime: route.estimatedDuration,
          minPrice: route.basePrice,
          isPopular: route.isPopular,
          routeSlug: routeKey,
          isAirportPickup,
        });
      } else {
        // Update min price if this route has a lower price
        const existingRoute = routeMap.get(routeKey);
        if (route.basePrice && route.basePrice < existingRoute.minPrice) {
          existingRoute.minPrice = route.basePrice;
        }
      }
    });

    // Convert map to array and apply search filter if needed
    let routesArray = Array.from(routeMap.values());

    if (query && query.length >= 2) {
      const lowerQuery = query.toLowerCase();
      routesArray = routesArray.filter(
        (route) =>
          route.fromLocation.name.toLowerCase().includes(lowerQuery) ||
          route.toLocation.name.toLowerCase().includes(lowerQuery) ||
          route.fromLocation.slug.includes(lowerQuery) ||
          route.toLocation.slug.includes(lowerQuery) ||
          (route.fromLocation.code && route.fromLocation.code.toLowerCase().includes(lowerQuery)) ||
          (route.toLocation.code && route.toLocation.code.toLowerCase().includes(lowerQuery))
      );
    }

    // Sort: popular first, then by from location name
    routesArray.sort((a, b) => {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return a.fromLocation.name.localeCompare(b.fromLocation.name);
    });

    return NextResponse.json({
      success: true,
      routes: routesArray,
      total: routesArray.length,
    });
  } catch (error: any) {
    logger.error('Airport transfer routes error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch routes',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
