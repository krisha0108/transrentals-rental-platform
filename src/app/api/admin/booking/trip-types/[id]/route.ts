import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Get single trip type
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

    const tripType = await prisma.trip_types.findUnique({
      where: { id },
      include: {
        serviceTripTypes: {
          include: {
            service: true,
          },
        },
        localPackages: true,
        _count: {
          select: {
            fleetPricing: true,
            routePricing: true,
          },
        },
      },
    });

    if (!tripType) {
      return NextResponse.json({ error: 'Trip type not found' }, { status: 404 });
    }

    return NextResponse.json(tripType);
  } catch (error: any) {
    logger.error('Trip type get error', error);
    return NextResponse.json({ error: 'Failed to fetch trip type', details: error?.message }, { status: 500 });
  }
}

// PUT - Update trip type
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

    const existing = await prisma.trip_types.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Trip type not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      icon,
      requiresFromLocation,
      requiresToLocation,
      requiresReturnDate,
      isActive,
      displayOrder,
    } = body;

    // Check if new slug conflicts
    if (slug && slug !== existing.slug) {
      const slugConflict = await prisma.trip_types.findUnique({
        where: { slug },
      });
      if (slugConflict) {
        return NextResponse.json({ error: 'A trip type with this slug already exists' }, { status: 400 });
      }
    }

    const tripType = await prisma.trip_types.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        slug: slug !== undefined ? slug : existing.slug,
        description: description !== undefined ? description : existing.description,
        icon: icon !== undefined ? icon : existing.icon,
        requiresFromLocation: requiresFromLocation !== undefined ? requiresFromLocation : existing.requiresFromLocation,
        requiresToLocation: requiresToLocation !== undefined ? requiresToLocation : existing.requiresToLocation,
        requiresReturnDate: requiresReturnDate !== undefined ? requiresReturnDate : existing.requiresReturnDate,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
      },
    });

    return NextResponse.json(tripType);
  } catch (error: any) {
    logger.error('Trip type update error', error);
    return NextResponse.json({ error: 'Failed to update trip type', details: error?.message }, { status: 500 });
  }
}

// DELETE - Delete trip type
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

    const existing = await prisma.trip_types.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            serviceTripTypes: true,
            fleetPricing: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Trip type not found' }, { status: 404 });
    }

    if (existing._count.serviceTripTypes > 0 || existing._count.fleetPricing > 0) {
      return NextResponse.json({
        error: 'Cannot delete trip type that is in use. Remove associations first.'
      }, { status: 400 });
    }

    await prisma.trip_types.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Trip type delete error', error);
    return NextResponse.json({ error: 'Failed to delete trip type', details: error?.message }, { status: 500 });
  }
}
