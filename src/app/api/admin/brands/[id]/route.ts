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
        services: {
          select: { id: true, name: true, slug: true },
        },
        vehicleModels: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { vehicle_models: true },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, brand });
  } catch (error: any) {
    logger.error('Get brand error', error);
    return NextResponse.json(
      { error: 'Failed to fetch brand', details: error?.message },
      { status: 500 }
    );
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
    const body = await request.json();
    const { name, logo, description, country, isActive, displayOrder } = body;

    const existing = await prisma.brands.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // If name changed, check for duplicates in same service
    if (name && name !== existing.name) {
      const duplicate = await prisma.brands.findFirst({
        where: {
          serviceId: existing.serviceId,
          name,
          NOT: { id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Brand with this name already exists for this service' },
          { status: 400 }
        );
      }
    }

    const brand = await prisma.brands.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(logo !== undefined && { logo }),
        ...(description !== undefined && { description }),
        ...(country !== undefined && { country }),
        ...(isActive !== undefined && { isActive }),
        ...(displayOrder !== undefined && { displayOrder }),
      },
      include: {
        services: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ success: true, brand });
  } catch (error: any) {
    logger.error('Update brand error', error);
    return NextResponse.json(
      { error: 'Failed to update brand', details: error?.message },
      { status: 500 }
    );
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
        _count: { select: { vehicle_models: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Check if brand has vehicle models
    if (existing._count.vehicle_modelss > 0) {
      return NextResponse.json(
        { error: `Cannot delete brand. It has ${existing._count.vehicle_modelss} vehicle model(s) associated with it.` },
        { status: 400 }
      );
    }

    await prisma.brands.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Brand deleted successfully' });
  } catch (error: any) {
    logger.error('Delete brand error', error);
    return NextResponse.json(
      { error: 'Failed to delete brand', details: error?.message },
      { status: 500 }
    );
  }
}
