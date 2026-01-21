import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { revalidatePath } from 'next/cache';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get rates for a fleet or location
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

    const rates = await prisma.fleet_location_rates.findMany({
      where,
      include: {
        fleet: true,
        location: true,
      },
      orderBy: { location: { name: 'asc' } },
    });

    return NextResponse.json(rates);
  } catch (error) {
    logger.error('Rates list error', error);
    return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 });
  }
}

// POST - Create or update rates (bulk)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fleetId, rates } = body;

    if (!fleetId || !rates || !Array.isArray(rates)) {
      return NextResponse.json({ error: 'Fleet ID and rates array are required' }, { status: 400 });
    }

    // Upsert each rate
    const results = await Promise.all(
      rates.map(async (rate: any) => {
        const { locationId, dailyRate, weeklyRate, monthlyRate, kmLimit, extraKmRate, securityDeposit, isActive } = rate;

        if (!locationId || dailyRate === undefined) {
          return null;
        }

        return prisma.fleet_location_rates.upsert({
          where: {
            fleetId_locationId: { fleetId, locationId },
          },
          update: {
            dailyRate: parseFloat(dailyRate),
            weeklyRate: weeklyRate ? parseFloat(weeklyRate) : null,
            monthlyRate: monthlyRate ? parseFloat(monthlyRate) : null,
            kmLimit: kmLimit || 100,
            extraKmRate: extraKmRate ? parseFloat(extraKmRate) : 5,
            securityDeposit: securityDeposit ? parseFloat(securityDeposit) : 2000,
            isActive: isActive !== false,
          },
          create: {
            fleetId,
            locationId,
            dailyRate: parseFloat(dailyRate),
            weeklyRate: weeklyRate ? parseFloat(weeklyRate) : null,
            monthlyRate: monthlyRate ? parseFloat(monthlyRate) : null,
            kmLimit: kmLimit || 100,
            extraKmRate: extraKmRate ? parseFloat(extraKmRate) : 5,
            securityDeposit: securityDeposit ? parseFloat(securityDeposit) : 2000,
            isActive: isActive !== false,
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
    logger.error('Rates update error', error);
    return NextResponse.json({ error: 'Failed to update rates' }, { status: 500 });
  }
}

// DELETE - Delete a rate
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

    await prisma.fleet_location_rates.delete({
      where: {
        fleetId_locationId: { fleetId, locationId },
      },
    });

    revalidatePath('/fleet');

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Rate delete error', error);
    return NextResponse.json({ error: 'Failed to delete rate' }, { status: 500 });
  }
}
