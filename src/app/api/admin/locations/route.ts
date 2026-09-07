import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List all locations with hierarchy
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // COUNTRY, STATE, CITY, AREA
    const types = searchParams.get('types'); // Comma-separated types: CITY,UNION_TERRITORY
    const parentId = searchParams.get('parentId');
    const isActive = searchParams.get('isActive');
    const flat = searchParams.get('flat') === 'true'; // Get flat list without hierarchy

    const where: any = {};

    if (types) {
      // Multiple types (comma-separated)
      where.type = { in: types.split(',').map(t => t.trim()) };
    } else if (type) {
      // Single type
      where.type = type;
    }

    if (parentId) {
      where.parentId = parentId;
    } else if (parentId === '') {
      // Root level locations (countries)
      where.parentId = null;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (flat) {
      // Flat list - all locations
      const locations = await prisma.locations.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        include: {
          locations: {
            select: { id: true, name: true, type: true },
          },
          _count: {
            select: { other_locations: true, service_locations: true },
          },
        },
      });

      // Transform for frontend
      return NextResponse.json(transformPrismaResponse(locations));
    }

    // Hierarchical tree structure - get root locations with nested children
    const locations = await prisma.locations.findMany({
      where: { ...where, parentId: parentId || null },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { other_locations: {
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
          include: {
            _count: {
              select: { other_locations: true, service_locations: true },
            }, other_locations: {
              orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
              include: {
                _count: {
                  select: { other_locations: true, service_locations: true },
                }, other_locations: {
                  orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
                  include: {
                    _count: {
                      select: { other_locations: true, service_locations: true },
                    },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { other_locations: true, service_locations: true },
        },
      },
    });

    // Transform for frontend
    return NextResponse.json(transformPrismaResponse(locations));
  } catch (error: any) {
    logger.error('Locations list error', error);
    return NextResponse.json({ error: 'Failed to fetch locations', details: error?.message }, { status: 500 });
  }
}

// Helper function to generate next loc_<number> ID
async function generateNextLocationId(): Promise<string> {
  // Get ALL location IDs (both uppercase LOC_ and lowercase loc_)
  const locations = await prisma.locations.findMany({
    select: { id: true }
  });

  // Extract numbers from both LOC_<num> and loc_<num> patterns and find the maximum
  let maxNum = 0;
  for (const loc of locations) {
    // Match both uppercase LOC_123 and lowercase loc_123
    const match = loc.id.match(/^(loc|LOC)_(\d+)$/i);
    if (match) {
      const num = parseInt(match[2], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }

  // Return next ID with lowercase prefix
  return `loc_${maxNum + 1}`;
}

// POST - Create new location
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      type,
      parentId,
      code,
      image,
      description,
      latitude,
      longitude,
      timezone,
      isActive,
      displayOrder,
      metaTitle,
      metaDescription,
    } = body;

    // Validation
    if (!name || !slug || !type) {
      return NextResponse.json(
        { error: 'Name, slug, and type are required' },
        { status: 400 }
      );
    }

    // Check if slug exists
    const existing = await prisma.locations.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'A location with this slug already exists' },
        { status: 400 }
      );
    }

    // Validate parent if provided
    if (parentId) {
      const parent = await prisma.locations.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent location not found' },
          { status: 400 }
        );
      }
    }

    // Generate next loc_<number> ID
    const newId = await generateNextLocationId();

    const location = await prisma.locations.create({
      data: {
        id: newId,
        name,
        slug,
        type,
        parentId: parentId || null,
        code: code || null,
        image: image || null,
        description: description || null,
        latitude: latitude !== null && latitude !== undefined && latitude !== '' ? parseFloat(String(latitude)) : null,
        longitude: longitude !== null && longitude !== undefined && longitude !== '' ? parseFloat(String(longitude)) : null,
        timezone: timezone || 'Asia/Kolkata',
        isActive: isActive !== false,
        displayOrder: typeof displayOrder === 'string' ? parseInt(displayOrder) || 0 : (displayOrder || 0),
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
      },
      include: {
        locations: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    // The public /api/locations endpoint (used by every city autocomplete
    // on the site) caches its result for an hour — bust it now so a newly
    // added city shows up immediately instead of after the cache expires.
    revalidateTag('locations');

    return NextResponse.json(location, { status: 201 });
  } catch (error: any) {
    logger.error('Location create error', error);
    console.error('Location create error details:', error);
    return NextResponse.json({
      error: 'Failed to create location',
      details: error?.message || error?.toString(),
      code: error?.code
    }, { status: 500 });
  }
}
