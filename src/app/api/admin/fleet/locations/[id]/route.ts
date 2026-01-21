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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const location = await prisma.fleet_locations.findUnique({
      where: { id },
      include: {
        rates: {
          include: { fleet: true },
        },
        availability: {
          include: { fleet: true },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, slug, state, stateCode, tier, latitude, longitude, displayOrder, isActive } = body;

    // Check if slug is taken by another location
    if (slug) {
      const existing = await prisma.fleet_locations.findFirst({
        where: { slug, id: { not: id } },
      });
      if (existing) {
        return NextResponse.json({ error: 'A location with this slug already exists' }, { status: 400 });
      }
    }

    const location = await prisma.fleet_locations.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(state && { state }),
        ...(stateCode !== undefined && { stateCode }),
        ...(tier !== undefined && { tier }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    logger.error('Location update error', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

// DELETE - Delete location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await prisma.fleet_locations.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Location delete error', error);
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}
