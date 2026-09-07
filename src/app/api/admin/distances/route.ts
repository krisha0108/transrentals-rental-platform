import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';
import { authorizeCarRentalContentAccess } from '@/lib/auth/car-rental-content-access';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// This route has no [slug] segment — the city_distance_matrix table isn't
// service-scoped. Its only current consumer is the car-rental Distance
// Matrix admin/manager page, so it's gated as car-rental content.
async function authorize() {
  return authorizeCarRentalContentAccess('car-rental');
}

// GET - List all distances or get specific distance
export async function GET(request: NextRequest) {
  try {
    const access = await authorize();
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    }

    const { searchParams } = new URL(request.url);
    const fromLocationId = searchParams.get('from');
    const toLocationId = searchParams.get('to');

    // If both from and to provided, get specific distance
    if (fromLocationId && toLocationId) {
      // Use raw query to ensure we only get records where both locations exist
      const results = await prisma.$queryRaw`
        SELECT
          cdm.*,
          fl.id as fromLocationId_rel,
          fl.name as fromLocationName,
          fl.slug as fromLocationSlug,
          tl.id as toLocationId_rel,
          tl.name as toLocationName,
          tl.slug as toLocationSlug
        FROM city_distance_matrix cdm
        INNER JOIN locations fl ON cdm.fromLocationId = fl.id
        INNER JOIN locations tl ON cdm.toLocationId = tl.id
        WHERE (cdm.fromLocationId = ${fromLocationId} AND cdm.toLocationId = ${toLocationId})
           OR (cdm.fromLocationId = ${toLocationId} AND cdm.toLocationId = ${fromLocationId})
        LIMIT 1
      ` as any[];

      const d = results[0];
      const distance = d
        ? {
            id: d.id,
            fromLocationId: d.fromLocationId,
            toLocationId: d.toLocationId,
            distanceKm: d.distanceKm,
            durationMinutes: d.durationMinutes,
            durationText: d.durationText,
            routeVia: d.routeVia,
            tollEstimate: d.tollEstimate ? Number(d.tollEstimate) : null,
            statePermit: Boolean(d.statePermit),
            isVerified: Boolean(d.isVerified),
            source: d.source,
            isActive: Boolean(d.isActive),
            lastUpdated: d.lastUpdated,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
            locations_city_distance_matrix_fromLocationIdTolocations: {
              id: d.fromLocationId_rel,
              name: d.fromLocationName,
              slug: d.fromLocationSlug,
            },
            locations_city_distance_matrix_toLocationIdTolocations: {
              id: d.toLocationId_rel,
              name: d.toLocationName,
              slug: d.toLocationSlug,
            },
          }
        : null;

      if (!distance) {
        return NextResponse.json({
          success: false,
          error: 'Distance not found for this route',
        });
      }

      // If we found the reverse route, swap the values
      const isReverse = distance.fromLocationId === toLocationId;

      // Add backward-compatible aliases
      const transformedDistance = {
        ...distance,
        // Swap if reverse
        locations_city_distance_matrix_fromLocationIdTolocations: isReverse ? distance.locations_city_distance_matrix_toLocationIdTolocations : distance.locations_city_distance_matrix_fromLocationIdTolocations,
        locations_city_distance_matrix_toLocationIdTolocations: isReverse ? distance.locations_city_distance_matrix_fromLocationIdTolocations : distance.locations_city_distance_matrix_toLocationIdTolocations,
        fromLocation: isReverse ? distance.locations_city_distance_matrix_toLocationIdTolocations : distance.locations_city_distance_matrix_fromLocationIdTolocations,
        toLocation: isReverse ? distance.locations_city_distance_matrix_fromLocationIdTolocations : distance.locations_city_distance_matrix_toLocationIdTolocations,
      };

      return NextResponse.json({
        success: true,
        distance: transformedDistance,
      });
    }

    // List all distances - use raw query to filter out orphan records
    // INNER JOIN ensures we only get records where both locations exist
    let distances: any[];

    if (fromLocationId) {
      distances = await prisma.$queryRaw`
        SELECT
          cdm.*,
          fl.id as fromLocationId_rel,
          fl.name as fromLocationName,
          fl.slug as fromLocationSlug,
          tl.id as toLocationId_rel,
          tl.name as toLocationName,
          tl.slug as toLocationSlug
        FROM city_distance_matrix cdm
        INNER JOIN locations fl ON cdm.fromLocationId = fl.id
        INNER JOIN locations tl ON cdm.toLocationId = tl.id
        WHERE cdm.fromLocationId = ${fromLocationId}
        ORDER BY cdm.createdAt DESC
      `;
    } else {
      distances = await prisma.$queryRaw`
        SELECT
          cdm.*,
          fl.id as fromLocationId_rel,
          fl.name as fromLocationName,
          fl.slug as fromLocationSlug,
          tl.id as toLocationId_rel,
          tl.name as toLocationName,
          tl.slug as toLocationSlug
        FROM city_distance_matrix cdm
        INNER JOIN locations fl ON cdm.fromLocationId = fl.id
        INNER JOIN locations tl ON cdm.toLocationId = tl.id
        ORDER BY cdm.createdAt DESC
      `;
    }

    // Transform to expected format with backward-compatible aliases
    const formattedDistances = (distances as any[]).map((d: any) => {
      const fromLoc = {
        id: d.fromLocationId_rel,
        name: d.fromLocationName,
        slug: d.fromLocationSlug,
      };
      const toLoc = {
        id: d.toLocationId_rel,
        name: d.toLocationName,
        slug: d.toLocationSlug,
      };
      return {
        id: d.id,
        fromLocationId: d.fromLocationId,
        toLocationId: d.toLocationId,
        distanceKm: d.distanceKm,
        durationMinutes: d.durationMinutes,
        durationText: d.durationText,
        routeVia: d.routeVia,
        tollEstimate: d.tollEstimate ? Number(d.tollEstimate) : null,
        statePermit: Boolean(d.statePermit),
        isVerified: Boolean(d.isVerified),
        source: d.source,
        isActive: Boolean(d.isActive),
        lastUpdated: d.lastUpdated,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        locations_city_distance_matrix_fromLocationIdTolocations: fromLoc,
        locations_city_distance_matrix_toLocationIdTolocations: toLoc,
        fromLocation: fromLoc, // Backward-compatible alias
        toLocation: toLoc,     // Backward-compatible alias
      };
    });

    return NextResponse.json({
      success: true,
      distances: formattedDistances,
      count: formattedDistances.length,
    });
  } catch (error: any) {
    logger.error('Failed to fetch distances', error);
    console.error('Distance API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch distances', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create or update distance (upsert)
export async function POST(request: NextRequest) {
  try {
    const access = await authorize();
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    }

    const body = await request.json();
    const {
      fromLocationId,
      toLocationId,
      distanceKm,
      durationMinutes,
      durationText,
      routeVia,
      tollEstimate,
      statePermit,
      isVerified,
      source,
      isActive,
      createReverse, // If true, create both directions
    } = body;

    if (!fromLocationId || !toLocationId || !distanceKm) {
      return NextResponse.json(
        { success: false, error: 'From, To locations and distance are required' },
        { status: 400 }
      );
    }

    if (fromLocationId === toLocationId) {
      return NextResponse.json(
        { success: false, error: 'From and To locations must be different' },
        { status: 400 }
      );
    }

    const data = {
      distanceKm,
      durationMinutes: durationMinutes || null,
      durationText: durationText || null,
      routeVia: routeVia || null,
      tollEstimate: tollEstimate || null,
      statePermit: statePermit || false,
      isVerified: isVerified || false,
      source: source || 'manual',
      isActive: isActive !== false,
      lastUpdated: new Date(),
    };

    // Upsert primary direction
    const distance = await prisma.city_distance_matrix.upsert({
      where: {
        fromLocationId_toLocationId: {
          fromLocationId,
          toLocationId,
        },
      },
      create: {
        id: generateId(),
        fromLocationId,
        toLocationId,
        ...data,
      },
      update: data,
      include: {
        locations_city_distance_matrix_fromLocationIdTolocations: { select: { id: true, name: true } },
        locations_city_distance_matrix_toLocationIdTolocations: { select: { id: true, name: true } },
      },
    });

    // If createReverse, also create/update the reverse direction
    if (createReverse) {
      await prisma.city_distance_matrix.upsert({
        where: {
          fromLocationId_toLocationId: {
            fromLocationId: toLocationId,
            toLocationId: fromLocationId,
          },
        },
        create: {
          id: generateId(),
          fromLocationId: toLocationId,
          toLocationId: fromLocationId,
          ...data,
        },
        update: data,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Distance saved${createReverse ? ' (both directions)' : ''}`,
      distance,
    });
  } catch (error: any) {
    logger.error('Failed to save distance', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save distance', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete distance
export async function DELETE(request: NextRequest) {
  try {
    const access = await authorize();
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const deleteBoth = searchParams.get('both') === 'true';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Distance ID is required' },
        { status: 400 }
      );
    }

    // Get the distance first to find reverse if needed
    const distance = await prisma.city_distance_matrix.findUnique({
      where: { id },
    });

    if (!distance) {
      return NextResponse.json(
        { success: false, error: 'Distance not found' },
        { status: 404 }
      );
    }

    // Delete primary
    await prisma.city_distance_matrix.delete({
      where: { id },
    });

    // Delete reverse if requested
    if (deleteBoth) {
      await prisma.city_distance_matrix.deleteMany({
        where: {
          fromLocationId: distance.toLocationId,
          toLocationId: distance.fromLocationId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Distance deleted${deleteBoth ? ' (both directions)' : ''}`,
    });
  } catch (error: any) {
    logger.error('Failed to delete distance', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete distance', details: error?.message },
      { status: 500 }
    );
  }
}
