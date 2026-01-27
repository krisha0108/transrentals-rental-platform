export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

// GET - Fetch all airports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceSlug = searchParams.get('serviceSlug');

    // Build where clause - filter by type AIRPORT
    const whereClause: any = {
      type: 'AIRPORT', // Only get locations with type AIRPORT
    };

    // If serviceSlug provided, filter by service
    if (serviceSlug) {
      const service = await prisma.services.findUnique({
        where: { slug: serviceSlug },
        select: { id: true },
      });

      if (service) {
        whereClause.service_locations = {
          some: {
            serviceId: service.id,
            isActive: true,
          },
        };
      }
    }

    const airports = await prisma.locations.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        latitude: true,
        longitude: true,
        description: true,
        isActive: true,
        locations: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [{ name: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      airports: airports.map((a) => ({
        id: a.id,
        name: a.name,
        code: a.code,
        slug: a.slug,
        latitude: a.latitude,
        longitude: a.longitude,
        description: a.description,
        isActive: a.isActive,
        locations: a.parent,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch airports:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch airports' }, { status: 500 });
  }
}

// POST - Create new airport
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, parentId, latitude, longitude, description, distanceFromCity, isActive, serviceSlug } = body;

    if (!name || !code || !parentId) {
      return NextResponse.json(
        { success: false, error: 'Name, code, and city are required' },
        { status: 400 }
      );
    }

    // Check if airport code already exists
    const existingAirport = await prisma.locations.findFirst({
      where: { code: code.toUpperCase(), type: 'AIRPORT' },
    });

    if (existingAirport) {
      return NextResponse.json(
        { success: false, error: `Airport with code ${code} already exists` },
        { status: 400 }
      );
    }

    // Get parent city for slug generation
    const parentCity = await prisma.locations.findUnique({
      where: { id: parentId },
    });

    if (!parentCity) {
      return NextResponse.json({ success: false, error: 'City not found' }, { status: 400 });
    }

    // Generate slug
    const slug = `${parentCity.name.toLowerCase().replace(/\s+/g, '-')}-airport-${code.toLowerCase()}`;

    // Get next location ID (fetch all and find max to avoid alphabetical ordering bug)
    const allLocations = await prisma.locations.findMany({
      where: { id: { startsWith: 'LOC_' } },
      select: { id: true },
    });
    const maxLocId = allLocations.reduce((max, loc) => {
      const num = parseInt(loc.id.replace('LOC_', ''));
      return num > max ? num : max;
    }, 0);
    const nextId = `LOC_${maxLocId + 1}`;

    // Create airport (stored as AIRPORT type)
    const airport = await prisma.locations.create({
      data: {
        id: nextId,
        name,
        slug,
        type: 'AIRPORT', // Airports are stored as AIRPORT type
        code: code.toUpperCase(),
        parentId,
        latitude: latitude || null,
        longitude: longitude || null,
        description: distanceFromCity
          ? `Distance from city center: ${distanceFromCity} km`
          : description || null,
        isActive: isActive !== false,
      },
      include: {
        locations: { select: { id: true, name: true } },
      },
    });

    // If serviceSlug provided, enable airport for that service
    if (serviceSlug) {
      const service = await prisma.services.findUnique({
        where: { slug: serviceSlug },
      });

      if (service) {
        // Get next service location ID (fetch all and find max to avoid alphabetical ordering bug)
        const allSLIds = await prisma.service_locations.findMany({
          where: { id: { startsWith: 'SL_' } },
          select: { id: true },
        });
        const maxSLId = allSLIds.reduce((max, sl) => {
          const num = parseInt(sl.id.replace('SL_', ''));
          return num > max ? num : max;
        }, 0);
        const nextSLId = `SL_${maxSLId + 1}`;

        await prisma.service_locations.create({
          data: {
            id: nextSLId,
            serviceId: service.id,
            locationId: airport.id,
            isActive: true,
          },
        });

        // Create airport transfer routes for all vehicle categories
        if (distanceFromCity) {
          await createAirportTransferRoutes(airport.id, parentId, service.id, distanceFromCity);
        }
      }
    }

    return NextResponse.json({ success: true, airport });
  } catch (error) {
    console.error('Failed to create airport:', error);
    return NextResponse.json({ success: false, error: 'Failed to create airport' }, { status: 500 });
  }
}

// Helper function to create airport transfer routes
async function createAirportTransferRoutes(
  airportId: string,
  cityId: string,
  serviceId: string,
  distanceKm: number
) {
  try {
    // Get all vehicle categories for this service
    const categories = await prisma.chauffeur_vehicle_categories.findMany({
      where: { serviceId, isActive: true },
    });

    // Airport transfer pricing per category
    const pricingMap: Record<string, { perKm: number; baseFare: number }> = {
      'car-rental-hatchback': { perKm: 18, baseFare: 299 },
      'car-rental-sedan': { perKm: 22, baseFare: 399 },
      'car-rental-sedan-executive': { perKm: 28, baseFare: 599 },
      'car-rental-suv': { perKm: 28, baseFare: 599 },
      'car-rental-suv-plus': { perKm: 32, baseFare: 799 },
      'car-rental-innova-crysta': { perKm: 38, baseFare: 999 },
      'car-rental-tempo-9-seater': { perKm: 42, baseFare: 1299 },
      'car-rental-tempo-12-seater': { perKm: 48, baseFare: 1599 },
      'car-rental-tempo-17-seater': { perKm: 55, baseFare: 1999 },
      'car-rental-luxury-sedan': { perKm: 120, baseFare: 3999 },
      'car-rental-luxury-suv': { perKm: 150, baseFare: 4999 },
    };

    // Get next route ID (fetch all and find max to avoid alphabetical ordering bug)
    const allRoutes = await prisma.chauffeur_route_packages.findMany({
      where: { id: { startsWith: 'CRP_' } },
      select: { id: true },
    });
    const maxRouteId = allRoutes.reduce((max, route) => {
      const num = parseInt(route.id.replace('CRP_', ''));
      return num > max ? num : max;
    }, 0);
    let nextRouteId = maxRouteId + 1;

    const duration = distanceKm < 20 ? '30-45 min' : distanceKm < 40 ? '45-60 min' : '1-1.5 hr';

    for (const category of categories) {
      const pricing = pricingMap[category.slug] || { perKm: 20, baseFare: 500 };
      const basePrice = Math.round(pricing.baseFare + distanceKm * pricing.perKm);

      // Airport to City route
      await prisma.chauffeur_route_packages.create({
        data: {
          id: `CRP_${nextRouteId++}`,
          vehicleCategoryId: category.id,
          fromLocationId: airportId,
          toLocationId: cityId,
          estimatedKm: distanceKm,
          estimatedDuration: duration,
          routeDescription: `Airport to City Center`,
          basePrice,
          returnMultiplier: 1.8,
          isPopular: true,
          isActive: true,
        },
      });

      // City to Airport route
      await prisma.chauffeur_route_packages.create({
        data: {
          id: `CRP_${nextRouteId++}`,
          vehicleCategoryId: category.id,
          fromLocationId: cityId,
          toLocationId: airportId,
          estimatedKm: distanceKm,
          estimatedDuration: duration,
          routeDescription: `City Center to Airport`,
          basePrice,
          returnMultiplier: 1.8,
          isPopular: true,
          isActive: true,
        },
      });
    }
  } catch (error) {
    console.error('Failed to create airport transfer routes:', error);
  }
}
