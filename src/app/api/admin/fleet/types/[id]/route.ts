import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get single fleet type
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = await prisma.fleet_types.findUnique({
      where: { id: params.id },
      include: {
        chauffeur_vehicle_categories: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { vehicles: true },
        },
      },
    });

    if (!type) {
      return NextResponse.json({ error: 'Type not found' }, { status: 404 });
    }

    return NextResponse.json(type);
  } catch (error) {
    logger.error('Fleet type fetch error', error);
    return NextResponse.json({ error: 'Failed to fetch fleet type' }, { status: 500 });
  }
}

// PUT - Update fleet type
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, categoryId, description, displayOrder, isActive } = body;

    // Get existing type
    const existing = await prisma.fleet_types.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Type not found' }, { status: 404 });
    }

    // Generate new slug if name changed
    let slug = existing.slug;
    if (name && name !== existing.name) {
      slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check for duplicate slug in the same category
      const duplicate = await prisma.fleet_types.findFirst({
        where: {
          slug,
          categoryId: categoryId || existing.categoryId,
          id: { not: params.id },
        },
      });

      if (duplicate) {
        return NextResponse.json({ error: 'A type with this name already exists in this category' }, { status: 400 });
      }
    }

    const type = await prisma.fleet_types.update({
      where: { id: params.id },
      data: {
        name: name || existing.name,
        slug,
        categoryId: categoryId || existing.categoryId,
        description: description !== undefined ? description : existing.description,
        displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
      include: {
        chauffeur_vehicle_categories: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json(type);
  } catch (error) {
    logger.error('Fleet type update error', error);
    return NextResponse.json({ error: 'Failed to update fleet type' }, { status: 500 });
  }
}

// DELETE - Delete fleet type
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if any vehicles are using this type
    const vehicleCount = await prisma.fleet.count({
      where: { typeId: params.id },
    });

    if (vehicleCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete type. ${vehicleCount} vehicle(s) are using this type.` },
        { status: 400 }
      );
    }

    await prisma.fleet_types.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Fleet type delete error', error);
    return NextResponse.json({ error: 'Failed to delete fleet type' }, { status: 500 });
  }
}
