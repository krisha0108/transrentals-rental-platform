import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

// GET - Fetch single airport
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const airport = await prisma.locations.findUnique({
      where: { id: params.id, type: 'AIRPORT' },
      include: {
        locations: { select: { id: true, name: true, slug: true } },
        service_locations: {
          include: { services: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    if (!airport) {
      return NextResponse.json({ success: false, error: 'Airport not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      airport: {
        ...airport,
        parent: airport.locations, // Map locations to parent
        locations: undefined // Remove duplicate
      }
    });
  } catch (error) {
    console.error('Failed to fetch airport:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch airport' }, { status: 500 });
  }
}

// PUT - Update airport
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, code, parentId, latitude, longitude, description, isActive } = body;

    const existingAirport = await prisma.locations.findUnique({
      where: { id: params.id },
    });

    if (!existingAirport || existingAirport.type !== 'AIRPORT') {
      return NextResponse.json({ success: false, error: 'Airport not found' }, { status: 404 });
    }

    // Check if code is being changed and if new code already exists
    if (code && code.toUpperCase() !== existingAirport.code) {
      const duplicateCode = await prisma.locations.findFirst({
        where: {
          code: code.toUpperCase(),
          type: 'AIRPORT',
          id: { not: params.id },
        },
      });

      if (duplicateCode) {
        return NextResponse.json(
          { success: false, error: `Airport with code ${code} already exists` },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (parentId !== undefined) updateData.parentId = parentId;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update slug if name or code changed
    if (name || code) {
      const parent = parentId
        ? await prisma.locations.findUnique({ where: { id: parentId } })
        : existingAirport.parentId
          ? await prisma.locations.findUnique({ where: { id: existingAirport.parentId } })
          : null;

      if (parent) {
        const finalCode = code?.toUpperCase() || existingAirport.code;
        updateData.slug = `${parent.name.toLowerCase().replace(/\s+/g, '-')}-airport-${finalCode?.toLowerCase()}`;
      }
    }

    const airport = await prisma.locations.update({
      where: { id: params.id },
      data: updateData,
      include: {
        locations: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, airport });
  } catch (error) {
    console.error('Failed to update airport:', error);
    return NextResponse.json({ success: false, error: 'Failed to update airport' }, { status: 500 });
  }
}

// DELETE - Delete airport
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const airport = await prisma.locations.findUnique({
      where: { id: params.id },
    });

    if (!airport || airport.type !== 'AIRPORT') {
      return NextResponse.json({ success: false, error: 'Airport not found' }, { status: 404 });
    }

    // Delete in order: routes, city pricing, service locations, distance matrix, then airport
    await prisma.$transaction(async (tx) => {
      // Delete route packages involving this airport
      await tx.chauffeur_route_packages.deleteMany({
        where: {
          OR: [{ fromLocationId: params.id }, { toLocationId: params.id }],
        },
      });

      // Delete city pricing for this airport
      await tx.chauffeur_city_pricing.deleteMany({
        where: { locationId: params.id },
      });

      // Delete distance matrix entries
      await tx.city_distance_matrix.deleteMany({
        where: {
          OR: [{ fromLocationId: params.id }, { toLocationId: params.id }],
        },
      });

      // Delete service locations
      await tx.service_locations.deleteMany({
        where: { locationId: params.id },
      });

      // Delete bookings if any exist (these don't have CASCADE)
      await tx.chauffeur_bookings.deleteMany({
        where: { locationId: params.id },
      });

      // Delete the airport
      await tx.locations.delete({
        where: { id: params.id },
      });
    });

    return NextResponse.json({ success: true, message: 'Airport deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete airport - Full error:', error);

    // Check for foreign key constraint errors
    if (error.code === 'P2003') {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete airport: It has related bookings or data. Please remove all associated data first.',
        details: error.meta?.field_name || 'Foreign key constraint violation'
      }, { status: 400 });
    }

    // Check for other Prisma errors
    if (error.code) {
      return NextResponse.json({
        success: false,
        error: `Database error: ${error.message}`,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete airport',
      details: error.toString()
    }, { status: 500 });
  }
}
