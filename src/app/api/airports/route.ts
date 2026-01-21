import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

// Force dynamic rendering (API routes with query params should not be static)
export const dynamic = 'force-dynamic';
// Cache airports for 1 hour
export const revalidate = 3600;

// GET - Public endpoint to fetch airports for booking forms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city'); // Filter by city
    const serviceSlug = searchParams.get('serviceSlug'); // Filter by service

    // Build where clause - airports have airport codes (IATA codes)
    const whereClause: any = {
      code: { not: null }, // Airports have airport codes
      isActive: true,
    };

    // If city provided, filter by parent city
    if (city) {
      const citySlug = city.toLowerCase().replace(/\s+/g, '-');
      whereClause.locations = {
        OR: [
          { name: { contains: city } },
          { slug: citySlug },
          { slug: { contains: citySlug } },
        ],
      };
    }

    // Note: We don't filter by serviceSlug for airports as they should be available for all services

    // Fetch airports
    const airports = await prisma.locations.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        code: true,
        latitude: true,
        longitude: true,
        description: true,
        locations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Format response for booking forms
    const formattedAirports = airports.map((airport) => ({
      id: airport.id,
      name: airport.name,
      code: airport.code || 'N/A',
      slug: airport.slug,
      displayName: `${airport.code || airport.name} - ${airport.name}`,
      shortName: `${airport.code || airport.name} Airport`,
      city: airport.locations?.name || null,
      citySlug: airport.locations?.slug || null,
      cityId: airport.locations?.id || null,
      coordinates: airport.latitude && airport.longitude
        ? { lat: airport.latitude, lng: airport.longitude }
        : null,
      description: airport.description,
    }));

    return NextResponse.json({
      success: true,
      airports: formattedAirports,
      count: formattedAirports.length,
    });
  } catch (error: any) {
    console.error('Failed to fetch airports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch airports' },
      { status: 500 }
    );
  }
}
