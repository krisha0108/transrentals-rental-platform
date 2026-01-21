import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { revalidatePath } from 'next/cache';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get availability for a fleet
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fleetId = searchParams.get('fleetId') || '';
    const locationId = searchParams.get('locationId') || '';

    const where: any = {};

    if (fleetId) {
      where.fleetId = fleetId;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    const availability = await prisma.fleet_availability.findMany({
      where,
      include: {
        fleet: true,
        location: true,
      },
      orderBy: { location: { name: 'asc' } },
    });

    return NextResponse.json(availability);
  } catch (error) {
    logger.error('Availability list error', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}

// POST - Update availability (bulk)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fleetId, availability } = body;

    if (!fleetId || !availability || !Array.isArray(availability)) {
      return NextResponse.json({ error: 'Fleet ID and availability array are required' }, { status: 400 });
    }

    // Upsert each availability record
    const results = await Promise.all(
      availability.map(async (avail: any) => {
        const { locationId, isAvailable, quantity, notes } = avail;

        if (!locationId) {
          return null;
        }

        return prisma.fleet_availability.upsert({
          where: {
            fleetId_locationId: { fleetId, locationId },
          },
          update: {
            isAvailable: isAvailable !== false,
            quantity: quantity || 1,
            notes,
          },
          create: {
            fleetId,
            locationId,
            isAvailable: isAvailable !== false,
            quantity: quantity || 1,
            notes,
          },
          include: {
            location: true,
          },
        });
      })
    );

    revalidatePath('/fleet');

    return NextResponse.json({ success: true, updated: results.filter(Boolean).length });
  } catch (error) {
    logger.error('Availability update error', error);
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}

// DELETE - Remove availability for a location
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fleetId = searchParams.get('fleetId');
    const locationId = searchParams.get('locationId');

    if (!fleetId || !locationId) {
      return NextResponse.json({ error: 'Fleet ID and Location ID are required' }, { status: 400 });
    }

    await prisma.fleet_availability.delete({
      where: {
        fleetId_locationId: { fleetId, locationId },
      },
    });

    revalidatePath('/fleet');

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Availability delete error', error);
    return NextResponse.json({ error: 'Failed to delete availability' }, { status: 500 });
  }
}
