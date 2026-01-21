import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { revalidatePath } from 'next/cache';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get single fleet vehicle
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vehicle = await prisma.fleet.findUnique({
      where: { id: params.id },
      include: {
        fleet_categories: true,
        fleet_types: true,
        fleet_location_rates: {
          include: { fleet_locations: true },
          orderBy: { fleet_locations: { name: 'asc' } },
        },
        fleet_availability: {
          include: { fleet_locations: true },
          orderBy: { fleet_locations: { name: 'asc' } },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    logger.error('Fleet get error', error);
    return NextResponse.json({ error: 'Failed to fetch vehicle' }, { status: 500 });
  }
}

// PUT - Update fleet vehicle
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
    const {
      name,
      slug,
      brand,
      categoryId,
      typeId,
      vehicleType,
      basePrice,
      description,
      shortDesc,
      specs,
      features,
      primaryImage,
      images,
      availabilityType,
      seoKeywords,
      metaTitle,
      metaDescription,
      isActive,
      isFeatured,
      priority,
    } = body;

    // Check if slug is taken by another vehicle
    if (slug) {
      const existing = await prisma.fleet.findFirst({
        where: { slug, id: { not: params.id } },
      });
      if (existing) {
        return NextResponse.json({ error: 'A vehicle with this slug already exists' }, { status: 400 });
      }
    }

    const vehicle = await prisma.fleet.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(brand && { brand }),
        ...(categoryId && { categoryId }),
        ...(typeId !== undefined && { typeId: typeId || null }),
        ...(vehicleType && { vehicleType }),
        ...(basePrice !== undefined && { basePrice: parseFloat(basePrice) }),
        ...(description !== undefined && { description }),
        ...(shortDesc !== undefined && { shortDesc }),
        ...(specs !== undefined && { specs }),
        ...(features !== undefined && { features }),
        ...(primaryImage !== undefined && { primaryImage }),
        ...(images !== undefined && { images }),
        ...(availabilityType && { availabilityType }),
        ...(seoKeywords !== undefined && { seoKeywords }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
        ...(isActive !== undefined && { isActive }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(priority !== undefined && { priority: typeof priority === 'string' ? parseInt(priority) || 5 : priority }),
      },
      include: {
        fleet_categories: true,
        fleet_types: true,
      },
    });

    revalidatePath('/fleet');
    revalidatePath(`/fleet/${vehicle.slug}`);
    revalidatePath('/admin/fleet');

    return NextResponse.json(vehicle);
  } catch (error) {
    logger.error('Fleet update error', error);
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
  }
}

// DELETE - Delete fleet vehicle
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vehicle = await prisma.fleet.findUnique({
      where: { id: params.id },
      select: { slug: true },
    });

    await prisma.fleet.delete({ where: { id: params.id } });

    revalidatePath('/fleet');
    if (vehicle) {
      revalidatePath(`/fleet/${vehicle.slug}`);
    }
    revalidatePath('/admin/fleet');

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Fleet delete error', error);
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
  }
}
