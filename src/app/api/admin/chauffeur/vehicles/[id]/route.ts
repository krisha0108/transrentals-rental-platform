import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get single vehicle category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.chauffeur_vehicle_categories.findUnique({
      where: { id: params.id },
      include: {
        chauffeur_city_pricing: {
          include: { locations: { select: { id: true, name: true, slug: true } } },
        },
        chauffeur_local_packages: {
          include: { locations: { select: { id: true, name: true, slug: true } } },
        },
        chauffeur_route_packages: {
          include: {
            locations_chauffeur_route_packages_fromLocationIdTolocations: { select: { id: true, name: true, slug: true } },
            locations_chauffeur_route_packages_toLocationIdTolocations: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Vehicle category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error: any) {
    logger.error('Failed to fetch vehicle category', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicle category' },
      { status: 500 }
    );
  }
}

// PATCH - Update vehicle category
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      slug,
      description,
      seatingCapacity,
      luggageCapacity,
      acType,
      fuelType,
      image,
      icon,
      displayOrder,
      isActive,
      isPopular,
    } = body;

    // Check if category exists
    const existing = await prisma.chauffeur_vehicle_categories.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Vehicle category not found' },
        { status: 404 }
      );
    }

    // Check for duplicate slug/name if changing
    if (slug && slug !== existing.slug) {
      const duplicate = await prisma.chauffeur_vehicle_categories.findFirst({
        where: { slug, id: { not: params.id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: 'A category with this slug already exists' },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.chauffeur_vehicle_categories.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(slug && { slug: slug.toLowerCase().replace(/\s+/g, '-') }),
        ...(description !== undefined && { description }),
        ...(seatingCapacity !== undefined && { seatingCapacity }),
        ...(luggageCapacity !== undefined && { luggageCapacity }),
        ...(acType !== undefined && { acType }),
        ...(fuelType !== undefined && { fuelType }),
        ...(image !== undefined && { image }),
        ...(icon !== undefined && { icon }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
        ...(isPopular !== undefined && { isPopular }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Vehicle category updated successfully',
      category: updated,
    });
  } catch (error: any) {
    logger.error('Failed to update vehicle category', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vehicle category', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete vehicle category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.chauffeur_vehicle_categories.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            chauffeur_city_pricing: true,
            chauffeur_local_packages: true,
            chauffeur_route_packages: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Vehicle category not found' },
        { status: 404 }
      );
    }

    // Check if there are related records
    const totalRelated =
      existing._count.chauffeur_city_pricing +
      existing._count.chauffeur_local_packages +
      existing._count.chauffeur_route_packages;

    if (totalRelated > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete: This category has ${totalRelated} related pricing/package records. Delete them first.`,
        },
        { status: 400 }
      );
    }

    await prisma.chauffeur_vehicle_categories.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Vehicle category deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete vehicle category', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete vehicle category', details: error?.message },
      { status: 500 }
    );
  }
}
