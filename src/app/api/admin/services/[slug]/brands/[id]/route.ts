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
  { params }: { params: Promise<{ slug: string; id: string }> }
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
        _count: {
          select: { vehicle_models: true },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json(brand);
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
  { params }: { params: Promise<{ slug: string; id: string }> }
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

    const { slug: serviceSlug, id } = await params;
    const body = await request.json();
    const { name, slug: brandSlug, logo, description, country, isActive, displayOrder } = body;

    // Find the service by slug
    const service = await prisma.services.findUnique({
      where: { slug: serviceSlug },
      select: { id: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Check if brand exists
    const existing = await prisma.brands.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Check if new slug conflicts with another brand within the same service
    if (brandSlug && brandSlug !== existing.slug) {
      const slugConflict = await prisma.brands.findFirst({
        where: {
          serviceId: service.id,
          slug: brandSlug,
          id: { not: id },
        },
      });

      if (slugConflict) {
        return NextResponse.json(
          { error: 'A brand with this slug already exists in this service' },
          { status: 400 }
        );
      }
    }

    const brand = await prisma.brands.update({
      where: { id },
      data: {
        name: name || existing.name,
        slug: brandSlug || existing.slug,
        logo: logo !== undefined ? logo : existing.logo,
        description: description !== undefined ? description : existing.description,
        country: country !== undefined ? country : existing.country,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
      },
    });

    return NextResponse.json(brand);
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
  { params }: { params: Promise<{ slug: string; id: string }> }
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

    // Check if brand has vehicle models
    const brand = await prisma.brands.findUnique({
      where: { id },
      include: {
        _count: {
          select: { vehicle_models: true },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    if (brand._count.vehicle_modelss > 0) {
      return NextResponse.json(
        { error: 'Cannot delete brand with vehicle models. Delete vehicle models first.' },
        { status: 400 }
      );
    }

    await prisma.brands.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Brand deleted successfully' });
  } catch (error: any) {
    logger.error('Delete brand error', error);
    return NextResponse.json(
      { error: 'Failed to delete brand', details: error?.message },
      { status: 500 }
    );
  }
}
