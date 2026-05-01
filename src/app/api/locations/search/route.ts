// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Search locations by query
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || 'CITY';

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        locations: [],
        message: 'Query must be at least 2 characters',
      });
    }

    // Build type filter - when searching for CITY, include UNION_TERRITORY too
    const typeFilter = type === 'ALL'
      ? {}
      : type === 'CITY'
        ? { type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] } }
        : { type: type };

    // Search locations by name (MySQL is case-insensitive by default)
    const locations = await prisma.locations.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { name: { contains: query } },
              { slug: { contains: query.toLowerCase().replace(/\s+/g, '-') } },
              { code: { contains: query } },
            ],
          },
          typeFilter,
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        code: true,
        type: true,
        latitude: true,
        longitude: true,
        parent: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      take: limit,
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      locations: locations.map((loc) => ({
        ...loc,
        displayName: loc.type === 'AIRPORT' ? `${loc.code} - ${loc.name}` : loc.name,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to search locations', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search locations', details: error?.message },
      { status: 500 }
    );
  }
}
