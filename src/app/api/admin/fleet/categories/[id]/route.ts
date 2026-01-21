import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const category = await prisma.fleet_categories.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { vehicles: true, types: true },
        },
        types: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    logger.error('Category fetch error', error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

// PUT - Update category
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
    const { name, slug, description, icon, displayOrder, isActive, specFields } = body;

    const existing = await prisma.fleet_categories.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check for duplicate slug
    if (slug && slug !== existing.slug) {
      const duplicate = await prisma.fleet_categories.findFirst({
        where: { slug, id: { not: params.id } },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 400 });
      }
    }

    const category = await prisma.fleet_categories.update({
      where: { id: params.id },
      data: {
        name: name || existing.name,
        slug: slug || existing.slug,
        description: description !== undefined ? description : existing.description,
        icon: icon !== undefined ? icon : existing.icon,
        displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        specFields: specFields !== undefined ? specFields : existing.specFields,
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    logger.error('Category update error', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if any vehicles are using this category
    const vehicleCount = await prisma.fleet.count({
      where: { categoryId: params.id },
    });

    if (vehicleCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category. ${vehicleCount} vehicle(s) are using this category.` },
        { status: 400 }
      );
    }

    // Delete all types first (cascade should handle this, but being explicit)
    await prisma.fleet_types.deleteMany({
      where: { categoryId: params.id },
    });

    await prisma.fleet_categories.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Category delete error', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
