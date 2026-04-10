import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Get single service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const service = await prisma.services.findUnique({
      where: { id },
      include: {
        other_services: {
          orderBy: { displayOrder: 'asc' },
        },
        services: true,
        serviceTripTypes: {
          include: {
            tripType: true,
          },
        },
        localPackages: {
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: {
            vehicle_models: true,
            vendor_fleets: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error: any) {
    logger.error('Service get error', error);
    return NextResponse.json({ error: 'Failed to fetch service', details: error?.message }, { status: 500 });
  }
}

// PUT - Update service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.services.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      shortDesc,
      icon,
      image,
      flowType,
      config,
      formFields,
      isActive,
      displayOrder,
      metaTitle,
      metaDescription,
      tripTypeIds, // Array of trip type IDs to assign
    } = body;

    // Check if new slug conflicts with another service
    if (slug && slug !== existing.slug) {
      const slugConflict = await prisma.services.findUnique({
        where: { slug },
      });
      if (slugConflict) {
        return NextResponse.json({ error: 'A service with this slug already exists' }, { status: 400 });
      }
    }

    // Update service
    const service = await prisma.$transaction(async (tx) => {
      const updated = await tx.service.update({
        where: { id },
        data: {
          name: name !== undefined ? name : existing.name,
          slug: slug !== undefined ? slug : existing.slug,
          description: description !== undefined ? description : existing.description,
          shortDesc: shortDesc !== undefined ? shortDesc : existing.shortDesc,
          icon: icon !== undefined ? icon : existing.icon,
          image: image !== undefined ? image : existing.image,
          flowType: flowType !== undefined ? flowType : existing.flowType,
          config: config !== undefined ? config : existing.config,
          formFields: formFields !== undefined ? formFields : existing.formFields,
          isActive: isActive !== undefined ? isActive : existing.isActive,
          displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
          metaTitle: metaTitle !== undefined ? metaTitle : existing.metaTitle,
          metaDescription: metaDescription !== undefined ? metaDescription : existing.metaDescription,
        },
      });

      // Update trip type mappings if provided
      if (tripTypeIds !== undefined) {
        // Remove existing mappings
        await tx.serviceTripType.deleteMany({
          where: { serviceId: id },
        });

        // Create new mappings
        if (tripTypeIds.length > 0) {
          await tx.serviceTripType.createMany({
            data: tripTypeIds.map((tripTypeId: string) => ({
              serviceId: id,
              tripTypeId,
            })),
          });
        }
      }

      return updated;
    });

    // Fetch updated service with relations
    const updatedService = await prisma.services.findUnique({
      where: { id },
      include: {
        other_services: true,
        services: true,
        serviceTripTypes: {
          include: {
            tripType: true,
          },
        },
        localPackages: true,
      },
    });

    return NextResponse.json(updatedService);
  } catch (error: any) {
    logger.error('Service update error', error);
    return NextResponse.json({ error: 'Failed to update service', details: error?.message }, { status: 500 });
  }
}

// DELETE - Delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.services.findUnique({
      where: { id },
      include: {
        other_services: true,
        _count: {
          select: {
            vehicle_models: true,
            vendor_fleets: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Check if service has children
    if (existing.children.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete service with sub-services. Delete sub-services first.'
      }, { status: 400 });
    }

    // Check if service has vehicle models
    if (existing._count.vehicle_modelss > 0) {
      return NextResponse.json({
        error: 'Cannot delete service with vehicle models. Delete vehicle models first.'
      }, { status: 400 });
    }

    await prisma.services.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Service delete error', error);
    return NextResponse.json({ error: 'Failed to delete service', details: error?.message }, { status: 500 });
  }
}
