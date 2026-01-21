import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// PUT - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, icon, isActive, displayOrder } = body;

    // Verify category exists and is a sub-service
    const existing = await prisma.services.findFirst({
      where: {
        id,
        parentId: { not: null },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (icon !== undefined) updateData.icon = icon;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

    const category = await prisma.services.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { vehicle_models: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      category,
      message: 'Category updated successfully',
    });
  } catch (error: any) {
    logger.error('Failed to update category', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify category exists and is a sub-service
    const existing = await prisma.services.findFirst({
      where: {
        id,
        parentId: { not: null },
      },
      include: {
        _count: {
          select: { vehicle_models: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    if (existing._count.vehicle_modelss > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete category with ${existing._count.vehicle_modelss} vehicle models. Remove the models first.` },
        { status: 400 }
      );
    }

    await prisma.services.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete category', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category', details: error?.message },
      { status: 500 }
    );
  }
}
