import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// GET - List all airport transfers (routes where from/to is an airport)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const airportId = searchParams.get('airportId');
    const vehicleCategoryId = searchParams.get('vehicleCategoryId');

    // First, get all airport location IDs
    const airports = await prisma.locations.findMany({
      where: { type: 'AIRPORT', isActive: true },
      select: { id: true },
    });
    const airportIds = airports.map(a => a.id);

    // Build where clause to find routes where either from or to is an airport
    const where: any = {
      OR: [
        { fromLocationId: { in: airportIds } },
        { toLocationId: { in: airportIds } },
      ],
    };

    // Additional filters
    if (airportId) {
      where.OR = [
        { fromLocationId: airportId },
        { toLocationId: airportId },
      ];
    }
    if (vehicleCategoryId) {
      where.vehicleCategoryId = vehicleCategoryId;
    }

    const transfers = await prisma.chauffeur_route_packages.findMany({
      where,
      include: {
        chauffeur_vehicle_categories: { select: { id: true, name: true, slug: true, seatingCapacity: true } },
        locations_chauffeur_route_packages_fromLocationIdTolocations: { select: { id: true, name: true, slug: true, type: true, code: true } },
        locations_chauffeur_route_packages_toLocationIdTolocations: { select: { id: true, name: true, slug: true, type: true, code: true } },
      },
      orderBy: [
        { locations_chauffeur_route_packages_fromLocationIdTolocations: { name: 'asc' } },
        { locations_chauffeur_route_packages_toLocationIdTolocations: { name: 'asc' } },
        { chauffeur_vehicle_categories: { displayOrder: 'asc' } },
      ],
    });

    return NextResponse.json({
      success: true,
      transfers,
      count: transfers.length,
    });
  } catch (error: any) {
    console.error('Failed to fetch airport transfers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch airport transfers' },
      { status: 500 }
    );
  }
}

// POST - Create new airport transfer package
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

    // Validation
    if (!vehicleCategoryId || !fromLocationId || !toLocationId) {
      return NextResponse.json(
        { success: false, error: 'Vehicle category, from location, and to location are required' },
        { status: 400 }
      );
    }

    if (!basePrice || basePrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid base price is required' },
        { status: 400 }
      );
    }

    if (fromLocationId === toLocationId) {
      return NextResponse.json(
        { success: false, error: 'From and To locations must be different' },
        { status: 400 }
      );
    }

    // Verify at least one location is an airport
    const locations = await prisma.locations.findMany({
      where: { id: { in: [fromLocationId, toLocationId] } },
      select: { id: true, type: true, name: true },
    });

    const hasAirport = locations.some(l => l.type === 'AIRPORT');
    if (!hasAirport) {
      return NextResponse.json(
        { success: false, error: 'At least one location must be an airport' },
        { status: 400 }
      );
    }

    // Upsert - create or update if exists
    const transfer = await prisma.chauffeur_route_packages.upsert({
      where: {
        vehicleCategoryId_fromLocationId_toLocationId: {
          vehicleCategoryId,
          fromLocationId,
          toLocationId,
        },
      },
      create: {
        id: generateId(),
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
        locations_chauffeur_route_packages_fromLocationIdTolocations: { select: { id: true, name: true, type: true } },
        locations_chauffeur_route_packages_toLocationIdTolocations: { select: { id: true, name: true, type: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Airport transfer package saved successfully',
      transfer,
    });
  } catch (error: any) {
    console.error('Failed to save airport transfer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save airport transfer', details: error?.message },
      { status: 500 }
    );
  }
}
