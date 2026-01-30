import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get single location
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const location = await prisma.locations.findUnique({
      where: { id },
      include: {
        locations: {
          select: { id: true, name: true, type: true, slug: true },
        }, other_locations: {
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true, type: true, slug: true, isActive: true },
        },
        service_locations: {
          include: {
            service: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json(location);
  } catch (error) {
    logger.error('Location get error', error);
    return NextResponse.json({ error: 'Failed to fetch location' }, { status: 500 });
  }
}

// PUT - Update location
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const {
      name,
      slug,
      type,
      parentId,
      code,
      image,
      description,
      latitude,
      longitude,
      timezone,
      isActive,
      displayOrder,
      metaTitle,
      metaDescription,
    } = body;

    // Check if slug is taken by another location
    if (slug) {
      const existing = await prisma.locations.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'A location with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Prevent circular parent reference
    if (parentId === id) {
      return NextResponse.json(
        { error: 'A location cannot be its own parent' },
        { status: 400 }
      );
    }

    const location = await prisma.locations.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(type && { type }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(code !== undefined && { code: code || null }),
        ...(image !== undefined && { image: image || null }),
        ...(description !== undefined && { description: description || null }),
        ...(latitude !== undefined && { latitude: latitude !== null && latitude !== '' ? parseFloat(String(latitude)) : null }),
        ...(longitude !== undefined && { longitude: longitude !== null && longitude !== '' ? parseFloat(String(longitude)) : null }),
        ...(timezone !== undefined && { timezone: timezone || 'Asia/Kolkata' }),
        ...(isActive !== undefined && { isActive }),
        ...(displayOrder !== undefined && { displayOrder: typeof displayOrder === 'string' ? parseInt(displayOrder) || 0 : displayOrder }),
        ...(metaTitle !== undefined && { metaTitle: metaTitle || null }),
        ...(metaDescription !== undefined && { metaDescription: metaDescription || null }),
      },
      include: {
        locations: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    return NextResponse.json(location);
  } catch (error: any) {
    logger.error('Location update error', error);
    console.error('Location update error details:', error);
    return NextResponse.json({
      error: 'Failed to update location',
      details: error?.message || error?.toString(),
      code: error?.code
    }, { status: 500 });
  }
}

// DELETE - Delete location
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if location has children
    const location = await prisma.locations.findUnique({
      where: { id },
      include: {
        _count: { select: { other_locations: true } },
      },
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    if (location._count.children > 0) {
      return NextResponse.json(
        { error: 'Cannot delete location with child locations. Delete children first.' },
        { status: 400 }
      );
    }

    await prisma.locations.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Location delete error', error);
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}
