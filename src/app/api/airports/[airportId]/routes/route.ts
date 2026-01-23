import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// Cache routes for 30 minutes
export const revalidate = 1800;

// GET - Fetch transfer routes for an airport (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: { airportId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const destination = searchParams.get('destination'); // Optional destination filter

    // Verify airport exists
    const airport = await prisma.locations.findUnique({
      where: { id: params.airportId, type: 'AIRPORT' },
      select: { id: true, name: true, code: true, locations: { select: { id: true, name: true } } },
    });

    if (!airport) {
      return NextResponse.json(
        { success: false, error: 'Airport not found' },
        { status: 404 }
      );
    }

    // Build where clause for routes
    const whereClause: any = {
      OR: [
        { fromLocationId: params.airportId },
        { toLocationId: params.airportId },
      ],
      isActive: true,
    };

    // If destination specified, filter by it
    if (destination) {
      whereClause.OR = [
        { fromLocationId: params.airportId, toLocation: { name: { contains: destination } } },
        { toLocationId: params.airportId, fromLocation: { name: { contains: destination } } },
      ];
    }

    // Fetch routes
    const routes = await prisma.chauffeur_route_packages.findMany({
      where: whereClause,
      select: {
        id: true,
        fromLocationId: true,
        toLocationId: true,
        estimatedKm: true,
        estimatedDuration: true,
        basePrice: true,
        returnMultiplier: true,
        tollsEstimate: true,
        nightSurcharge: true,
        airportSurcharge: true,
        isPopular: true,
        fromLocation: {
          select: { id: true, name: true, code: true, type: true },
        },
        toLocation: {
          select: { id: true, name: true, code: true, type: true },
        },
        chauffeur_vehicle_categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            seatingCapacity: true,
            luggageCapacity: true,
            description: true,
          },
        },
      },
      orderBy: [
        { chauffeur_vehicle_categories: { displayOrder: 'asc' } },
        { basePrice: 'asc' },
      ],
    });

    // Group routes by category for easy display
    const routesByCategory: Record<string, any[]> = {};
    routes.forEach((route) => {
      const catName = route.vehicle_category.name;
      if (!routesByCategory[catName]) {
        routesByCategory[catName] = [];
      }

      // Determine direction
      const isFromAirport = route.fromLocationId === params.airportId;

      routesByCategory[catName].push({
        id: route.id,
        direction: isFromAirport ? 'from_airport' : 'to_airport',
        origin: route.fromLocation,
        destination: route.toLocation,
        distance: route.estimatedKm,
        duration: route.estimatedDuration,
        basePrice: route.basePrice,
        roundTripPrice: Math.round(route.basePrice * route.returnMultiplier),
        tollsEstimate: route.tollsEstimate,
        isPopular: route.isPopular,
        chauffeur_vehicle_categories: {
          id: route.vehicle_category.id,
          name: route.vehicle_category.name,
          slug: route.vehicle_category.slug,
          seats: route.vehicle_category.seatingCapacity,
          luggage: route.vehicle_category.luggageCapacity,
        },
      });
    });

    // Get unique destinations (cities) for this airport
    const destinations = [...new Set(routes.map((r) => {
      const isFromAirport = r.fromLocationId === params.airportId;
      return isFromAirport ? r.toLocation.name : r.fromLocation.name;
    }))].filter((name) => name !== airport.name);

    return NextResponse.json({
      success: true,
      airport: {
        id: airport.id,
        name: airport.name,
        code: airport.code,
        city: airport.parent?.name,
      },
      routesByCategory,
      allRoutes: routes.map((r) => ({
        id: r.id,
        from: r.fromLocation.name,
        to: r.toLocation.name,
        category: r.vehicle_category.name,
        price: r.basePrice,
        distance: r.estimatedKm,
      })),
      destinations,
      totalRoutes: routes.length,
    });
  } catch (error: any) {
    console.error('Failed to fetch airport routes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch routes' },
      { status: 500 }
    );
  }
}
