import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { LocationType } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import logger from '@/lib/security/logger';

const getCachedLocations = unstable_cache(
  async (type: string, includeAirports: boolean, serviceSlug: string | null) => {
    const whereClause: any = { isActive: true };

    if (includeAirports && type === 'CITY') {
      whereClause.type = { in: ['CITY', 'UNION_TERRITORY', 'AIRPORT'] };
    } else if (type === 'CITY') {
      whereClause.type = { in: ['CITY', 'UNION_TERRITORY'] };
    } else {
      whereClause.type = type;
    }

    if (serviceSlug) {
      const service = await prisma.services.findUnique({
        where: { slug: serviceSlug },
        select: { id: true },
      });
      if (service) {
        whereClause.service_locations = {
          some: { serviceId: service.id, isActive: true },
        };
      }
    }

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
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: [
        { type: 'asc' },
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    return locations.map((loc) => ({
      ...loc,
      isAirport: loc.type === 'AIRPORT',
      displayName: loc.type === 'AIRPORT' ? `${loc.code} - ${loc.name}` : loc.name,
    }));
  },
  ['locations-list'],
  { revalidate: 3600, tags: ['locations'] }
);

// GET - Public endpoint to list active locations (cities and/or airports)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type') || 'CITY';
    const includeAirports = searchParams.get('includeAirports') === 'true';
    const serviceSlug = searchParams.get('serviceSlug');

    const validTypes = ['COUNTRY', 'STATE', 'UNION_TERRITORY', 'CITY', 'AREA', 'AIRPORT'];
    const type = validTypes.includes(typeParam) ? typeParam : 'CITY';

    const formattedLocations = await getCachedLocations(type, includeAirports, serviceSlug);

    return NextResponse.json({ success: true, locations: formattedLocations });
  } catch (error: any) {
    logger.error('Failed to fetch locations', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch locations', details: error?.message },
      { status: 500 }
    );
  }
}
