import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get single brand
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

    const brand = await prisma.brands.findUnique({
      where: { id },
      include: {
        vehicle_models: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            vehicle_models: true,
          },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch (error: any) {
    logger.error('Brand get error', error);
    return NextResponse.json({ error: 'Failed to fetch brand', details: error?.message }, { status: 500 });
  }
}

// PUT - Update brand
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

    const existing = await prisma.brands.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, slug, logo, description, country, serviceId, isActive, displayOrder } = body;

    // Check if new slug conflicts
    if (slug && slug !== existing.slug) {
      const slugConflict = await prisma.brands.findFirst({
        where: { slug },
      });
      if (slugConflict) {
        return NextResponse.json({ error: 'A brand with this slug already exists' }, { status: 400 });
      }
    }

    const brand = await prisma.brands.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        slug: slug !== undefined ? slug : existing.slug,
        logo: logo !== undefined ? logo : existing.logo,
        description: description !== undefined ? description : existing.description,
        country: country !== undefined ? country : existing.country,
        serviceId: serviceId !== undefined ? serviceId : existing.serviceId,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
      },
    });

    return NextResponse.json(brand);
  } catch (error: any) {
    logger.error('Brand update error', error);
    return NextResponse.json({ error: 'Failed to update brand', details: error?.message }, { status: 500 });
  }
}

// DELETE - Delete brand
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

    const existing = await prisma.brands.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            vehicle_models: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    if (existing._count.vehicle_models > 0) {
      return NextResponse.json({
        error: 'Cannot delete brand with vehicle models. Delete vehicle models first.'
      }, { status: 400 });
    }

    await prisma.brands.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Brand delete error', error);
    return NextResponse.json({ error: 'Failed to delete brand', details: error?.message }, { status: 500 });
  }
}
