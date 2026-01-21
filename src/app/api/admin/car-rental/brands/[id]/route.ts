import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// PUT - Update a brand
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
    const { name, logo, country, description, isActive, displayOrder, vehicleCategoryId } = body;

    // Verify brand exists
    const existing = await prisma.brands.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      );
    }

    // Verify vehicle category if provided
    if (vehicleCategoryId) {
      const vehicle_category = await prisma.chauffeur_vehicle_categories.findUnique({
        where: { id: vehicleCategoryId },
      });

      if (!vehicle_category) {
        return NextResponse.json(
          { success: false, error: 'Invalid vehicle category' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (logo !== undefined) updateData.logo = logo?.trim() || null;
    if (country !== undefined) updateData.country = country?.trim() || null;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (vehicleCategoryId !== undefined) updateData.vehicleCategoryId = vehicleCategoryId;

    const brand = await prisma.brands.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { vehicle_models: true },
        },
        chauffeur_vehicle_categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      brand,
      message: 'Brand updated successfully',
    });
  } catch (error: any) {
    logger.error('Failed to update brand', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update brand', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a brand
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

    // Verify brand exists
    const existing = await prisma.brands.findUnique({
      where: { id },
      include: {
        _count: {
          select: { vehicle_models: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      );
    }

    if (existing._count.vehicle_modelss > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete brand with ${existing._count.vehicle_modelss} vehicle models. Remove the models first.` },
        { status: 400 }
      );
    }

    await prisma.brands.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Brand deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete brand', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete brand', details: error?.message },
      { status: 500 }
    );
  }
}
