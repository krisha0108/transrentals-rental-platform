import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Public API - Get fleet locations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');
    const state = searchParams.get('state');

    const where: any = { isActive: true };

    if (tier) {
      where.tier = parseInt(tier);
    }

    if (state) {
      where.state = state;
    }

    const locations = await prisma.fleet_locations.findMany({
      where,
      orderBy: [{ tier: 'asc' }, { displayOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        state: true,
        stateCode: true,
        tier: true,
      },
    });

    return NextResponse.json(locations);
  } catch (error) {
    logger.error('Locations API error', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
