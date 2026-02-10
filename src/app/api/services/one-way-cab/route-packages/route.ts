import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Fetch vehicle packages for a specific route
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromSlug = searchParams.get('from');
    const toSlug = searchParams.get('to');

    if (!fromSlug || !toSlug) {
      return NextResponse.json(
        { success: false, error: 'Missing from or to parameter' },
        { status: 400 }
      );
    }

    // Get location IDs
    const [fromLocation, toLocation] = await Promise.all([
      prisma.locations.findFirst({
        where: { slug: fromSlug, isActive: true },
        select: { id: true },
      }),
      prisma.locations.findFirst({
        where: { slug: toSlug, isActive: true },
        select: { id: true },
      }),
    ]);

    if (!fromLocation || !toLocation) {
      return NextResponse.json(
        { success: false, error: 'Invalid route locations' },
        { status: 404 }
      );
    }

    // Fetch all packages for this route
    const packages = await prisma.chauffeur_route_packages.findMany({
      where: {
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id,
        isActive: true,
      },
      include: {
        chauffeur_vehicle_categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            seatingCapacity: true,
            luggageCapacity: true,
            acType: true,
            fuelType: true,
            image: true,
            exampleVehicles: true,
          },
        },
      },
      orderBy: {
        basePrice: 'asc', // Sort by price
      },
    });

    // Transform response
    const transformedPackages = packages.map((pkg) => ({
      id: pkg.id,
      vehicleCategory: {
        id: pkg.chauffeur_vehicle_categories.id,
        name: pkg.chauffeur_vehicle_categories.name,
        slug: pkg.chauffeur_vehicle_categories.slug,
        seatingCapacity: pkg.chauffeur_vehicle_categories.seatingCapacity,
        luggageCapacity: pkg.chauffeur_vehicle_categories.luggageCapacity,
        acType: pkg.chauffeur_vehicle_categories.acType,
        fuelType: pkg.chauffeur_vehicle_categories.fuelType,
        image: pkg.chauffeur_vehicle_categories.image,
        exampleVehicles: pkg.chauffeur_vehicle_categories.exampleVehicles,
      },
      basePrice: pkg.basePrice,
      estimatedTime: pkg.estimatedTime,
    }));

    return NextResponse.json({
      success: true,
      packages: transformedPackages,
      total: transformedPackages.length,
    });
  } catch (error: any) {
    logger.error('Route packages error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch route packages',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
