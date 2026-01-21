import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List all route packages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleCategoryId = searchParams.get('vehicleCategoryId');
    const fromLocationId = searchParams.get('fromLocationId');

    const where: any = {};
    if (vehicleCategoryId) where.vehicleCategoryId = vehicleCategoryId;
    if (fromLocationId) where.fromLocationId = fromLocationId;

    const routes = await prisma.chauffeur_route_packages.findMany({
      where,
      include: {
        chauffeur_vehicle_categories: { select: { id: true, name: true, slug: true } },
        locations_chauffeur_route_packages_fromLocationIdTolocations: { select: { id: true, name: true, slug: true } },
        locations_chauffeur_route_packages_toLocationIdTolocations: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [
        { chauffeur_vehicle_categories: { displayOrder: 'asc' } },
        { locations_chauffeur_route_packages_fromLocationIdTolocations: { name: 'asc' } },
        { locations_chauffeur_route_packages_toLocationIdTolocations: { name: 'asc' } },
      ],
    });

    // Transform routes to add backward-compatible field names
    const transformedRoutes = routes.map(route => ({
      ...route,
      fromLocation: route.locations_chauffeur_route_packages_fromLocationIdTolocations,
      toLocation: route.locations_chauffeur_route_packages_toLocationIdTolocations,
      vehicle_category: route.chauffeur_vehicle_categories,
    }));

    return NextResponse.json({
      success: true,
      routes: transformedRoutes,
    });
  } catch (error: any) {
    logger.error('Failed to fetch route packages', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch route packages' },
      { status: 500 }
    );
  }
}

// POST - Create or update route package (upsert)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vehicleCategoryId,
      fromLocationId,
      toLocationId,
      estimatedKm,
      estimatedDuration,
      routeDescription,
      basePrice,
      returnMultiplier,
      tollsEstimate,
      statePermitCharge,
      nightSurcharge,
      airportSurcharge,
      isPopular,
      displayOrder,
      isActive,
    } = body;

    if (!vehicleCategoryId || !fromLocationId || !toLocationId || !basePrice) {
      return NextResponse.json(
        { success: false, error: 'Vehicle category, from/to locations, and base price are required' },
        { status: 400 }
      );
    }

    if (fromLocationId === toLocationId) {
      return NextResponse.json(
        { success: false, error: 'From and To locations must be different' },
        { status: 400 }
      );
    }

    // Upsert - create or update
    const route = await prisma.chauffeur_route_packages.upsert({
      where: {
        vehicleCategoryId_fromLocationId_toLocationId: {
          vehicleCategoryId,
          fromLocationId,
          toLocationId,
        },
      },
      create: {
        vehicleCategoryId,
        fromLocationId,
        toLocationId,
        estimatedKm: estimatedKm || 0,
        estimatedDuration,
        routeDescription,
        basePrice,
        returnMultiplier: returnMultiplier || 1.8,
        tollsEstimate: tollsEstimate || 0,
        statePermitCharge: statePermitCharge || 0,
        nightSurcharge: nightSurcharge || 0,
        airportSurcharge: airportSurcharge || 0,
        isPopular: isPopular || false,
        displayOrder: displayOrder || 0,
        isActive: isActive !== false,
      },
      update: {
        estimatedKm: estimatedKm || 0,
        estimatedDuration,
        routeDescription,
        basePrice,
        returnMultiplier: returnMultiplier || 1.8,
        tollsEstimate: tollsEstimate || 0,
        statePermitCharge: statePermitCharge || 0,
        nightSurcharge: nightSurcharge || 0,
        airportSurcharge: airportSurcharge || 0,
        isPopular: isPopular || false,
        displayOrder: displayOrder || 0,
        isActive: isActive !== false,
      },
      include: {
        chauffeur_vehicle_categories: { select: { id: true, name: true } },
        locations_chauffeur_route_packages_fromLocationIdTolocations: { select: { id: true, name: true } },
        locations_chauffeur_route_packages_toLocationIdTolocations: { select: { id: true, name: true } },
      },
    });

    // Transform route to add backward-compatible field names
    const transformedRoute = {
      ...route,
      fromLocation: route.locations_chauffeur_route_packages_fromLocationIdTolocations,
      toLocation: route.locations_chauffeur_route_packages_toLocationIdTolocations,
      vehicle_category: route.chauffeur_vehicle_categories,
    };

    return NextResponse.json({
      success: true,
      message: 'Route package saved successfully',
      route: transformedRoute,
    });
  } catch (error: any) {
    logger.error('Failed to save route package', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save route package', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete route package
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Route ID is required' },
        { status: 400 }
      );
    }

    await prisma.chauffeur_route_packages.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Route package deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete route package', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete route package', details: error?.message },
      { status: 500 }
    );
  }
}
