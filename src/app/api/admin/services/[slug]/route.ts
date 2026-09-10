import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to find service by id or slug
async function findService(idOrSlug: string) {
  // Try to find by ID first (if it looks like a CUID)
  if (idOrSlug.length > 20) {
    const byId = await prisma.services.findUnique({ where: { id: idOrSlug } });
    if (byId) return byId;
  }
  // Otherwise try by slug
  return prisma.services.findUnique({ where: { slug: idOrSlug } });
}

// GET - Get single service
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug: idOrSlug } = params;

    // Find by id or slug
    const service = await prisma.services.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
      },
      include: {
        services: {
          select: { id: true, name: true, slug: true, flowType: true },
        }, other_services: {
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true, slug: true, isActive: true, icon: true },
        },
        service_locations: {
          include: {
            locations: {
              select: { id: true, name: true, slug: true, type: true },
            },
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    logger.error('Service get error', error);
    return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 });
  }
}

// PUT - Update service
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug: idOrSlug } = params;

    // Find the service first
    const existingService = await prisma.services.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
      },
    });

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const id = existingService.id;
    const body = await request.json();
    const {
      name,
      slug,
      parentId,
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
    } = body;

    // Check if slug is taken by another service
    if (slug) {
      const existing = await prisma.services.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'A service with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Prevent circular parent reference
    if (parentId === id) {
      return NextResponse.json(
        { error: 'A service cannot be its own parent' },
        { status: 400 }
      );
    }

    const service = await prisma.services.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(description !== undefined && { description: description || null }),
        ...(shortDesc !== undefined && { shortDesc: shortDesc || null }),
        ...(icon !== undefined && { icon: icon || null }),
        ...(image !== undefined && { image: image || null }),
        ...(flowType && { flowType }),
        ...(config !== undefined && { config }),
        ...(formFields !== undefined && { formFields }),
        ...(isActive !== undefined && { isActive }),
        ...(displayOrder !== undefined && { displayOrder: typeof displayOrder === 'string' ? parseInt(displayOrder) || 0 : displayOrder }),
        ...(metaTitle !== undefined && { metaTitle: metaTitle || null }),
        ...(metaDescription !== undefined && { metaDescription: metaDescription || null }),
      },
      include: {
        services: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    revalidateTag('services');

    return NextResponse.json(service);
  } catch (error) {
    logger.error('Service update error', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

// DELETE - Delete service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug: idOrSlug } = params;

    // Find the service first
    const service = await prisma.services.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug },
        ],
      },
      include: {
        _count: { select: { other_services: true } },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service._count.children > 0) {
      return NextResponse.json(
        { error: 'Cannot delete service with child services. Delete children first.' },
        { status: 400 }
      );
    }

    await prisma.services.delete({ where: { id: service.id } });

    revalidateTag('services');

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Service delete error', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
