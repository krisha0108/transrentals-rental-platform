import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { LocationType } from '@prisma/client';
import logger from '@/lib/security/logger';

// Force dynamic rendering (API routes with query params should not be static)
export const dynamic = 'force-dynamic';
// Cache locations for 1 hour - they rarely change
export const revalidate = 3600;

// GET - Public endpoint to list active locations (cities and/or airports)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type') || 'CITY';
    const includeAirports = searchParams.get('includeAirports') === 'true';
    const serviceSlug = searchParams.get('serviceSlug');

    // Validate and cast type to LocationType enum
    const validTypes = ['COUNTRY', 'STATE', 'UNION_TERRITORY', 'CITY', 'AREA', 'AIRPORT', 'VILLAGE'];
    const type = validTypes.includes(typeParam) ? (typeParam as LocationType) : 'CITY';

    // Build where clause
    const whereClause: any = {
      isActive: true,
    };

    // If includeAirports is true, fetch cities, union territories, villages and airports
    if (includeAirports && type === 'CITY') {
      whereClause.type = { in: ['CITY', 'UNION_TERRITORY', 'AIRPORT', 'VILLAGE'] };
    } else if (type === 'CITY') {
      // When querying for cities, also include union territories and villages (they're city-level)
      whereClause.type = { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] };
    } else {
      whereClause.type = type;
    }

    // If serviceSlug provided, filter by service locations
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

    // Fetch active locations of the specified type(s)
    const locations = await prisma.locations.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        code: true,
        type: true,
        image: true,
        latitude: true,
        longitude: true,
        locations: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: [
        { type: 'asc' }, // Cities first, then airports
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    // Format response - mark airports clearly
    const formattedLocations = locations.map((loc) => ({
      ...loc,
      isAirport: loc.type === 'AIRPORT',
      displayName: loc.type === 'AIRPORT' ? `${loc.code} - ${loc.name}` : loc.name,
    }));

    return NextResponse.json({
      success: true,
      locations: formattedLocations,
    });
  } catch (error: any) {
    logger.error('Failed to fetch locations', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch locations', details: error?.message },
      { status: 500 }
    );
  }
}
