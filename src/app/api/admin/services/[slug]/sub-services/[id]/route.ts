import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// PUT - Update a sub-service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    // Find the sub-service
    const existingSubService = await prisma.services.findUnique({
      where: { id },
    });

    if (!existingSubService) {
      return NextResponse.json({ error: 'Sub-service not found' }, { status: 404 });
    }

    const {
      name,
      slug: newSlug,
      description,
      shortDesc,
      icon,
      image,
      isActive,
      displayOrder,
    } = body;

    // Check if new slug already exists (if slug is being changed)
    if (newSlug && newSlug !== existingSubService.slug) {
      const slugExists = await prisma.services.findFirst({
        where: {
          slug: newSlug,
          id: { not: id },
        },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'A service with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update sub-service
    const sub_service = await prisma.services.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(newSlug !== undefined && { slug: newSlug }),
        ...(description !== undefined && { description }),
        ...(shortDesc !== undefined && { shortDesc }),
        ...(icon !== undefined && { icon }),
        ...(image !== undefined && { image }),
        ...(isActive !== undefined && { isActive }),
        ...(displayOrder !== undefined && { displayOrder }),
      },
    });

    return NextResponse.json({ success: true, sub_service });
  } catch (error: any) {
    logger.error('Sub-service update error', error);
    return NextResponse.json(
      { error: 'Failed to update sub-service', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a sub-service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Find the sub-service
    const existingSubService = await prisma.services.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            vehicle_models_vehicle_models_serviceIdToservices: true,
            vehicle_models_vehicle_models_subServiceIdToservices: true,
            other_services: true,
          },
        },
      },
    });

    if (!existingSubService) {
      return NextResponse.json({ error: 'Sub-service not found' }, { status: 404 });
    }

    // Check if there are associated vehicles or children
    const totalAssociations =
      existingSubService._count.vehicle_models_vehicle_models_serviceIdToservices +
      existingSubService._count.vehicle_models_vehicle_models_subServiceIdToservices +
      existingSubService._count.other_services;

    if (totalAssociations > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: This sub-service has ${totalAssociations} associated items (vehicles, models, or sub-categories). Please remove them first.`,
        },
        { status: 400 }
      );
    }

    // Delete sub-service
    await prisma.services.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Sub-service deleted' });
  } catch (error: any) {
    logger.error('Sub-service delete error', error);
    return NextResponse.json(
      { error: 'Failed to delete sub-service', details: error?.message },
      { status: 500 }
    );
  }
}
