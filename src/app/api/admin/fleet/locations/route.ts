export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
// GET - List all locations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tier = searchParams.get('tier') || '';
    const state = searchParams.get('state') || '';
    const activeOnly = searchParams.get('activeOnly') || '';

    const where: any = {};

    // Only filter by isActive if explicitly requested
    if (activeOnly === 'true') {
      where.isActive = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { state: { contains: search } },
      ];
    }

    if (tier) {
      where.tier = parseInt(tier);
    }

    if (state) {
      where.state = state;
    }

    const locations = await prisma.fleet_locations.findMany({
      where,
      orderBy: [{ tier: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { rates: true, availability: true },
        },
      },
    });

    return NextResponse.json(locations);
  } catch (error) {
    logger.error('Locations list error', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

// POST - Create new location
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, state, stateCode, tier, latitude, longitude, displayOrder, isActive } = body;

    if (!name || !slug || !state) {
      return NextResponse.json({ error: 'Name, slug, and state are required' }, { status: 400 });
    }

    // Check if slug exists
    const existing = await prisma.fleet_locations.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'A location with this slug already exists' }, { status: 400 });
    }

    const location = await prisma.fleet_locations.create({
      data: {
        name,
        slug,
        state,
        stateCode,
        tier: tier || 2,
        latitude,
        longitude,
        displayOrder: displayOrder || 0,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    logger.error('Location create error', error);
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}
