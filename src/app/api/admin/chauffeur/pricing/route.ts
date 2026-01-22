import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List all city pricing configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleCategoryId = searchParams.get('vehicleCategoryId');
    const locationId = searchParams.get('locationId');

    const where: any = {};
    if (vehicleCategoryId) where.vehicleCategoryId = vehicleCategoryId;
    if (locationId) where.locationId = locationId;

    const pricing = await prisma.chauffeur_city_pricing.findMany({
      where,
      include: {
        chauffeur_vehicle_categories: { select: { id: true, name: true, slug: true } },
        locations: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [
        { chauffeur_vehicle_categories: { displayOrder: 'asc' } },
        { locations: { name: 'asc' } },
      ],
    });

    return NextResponse.json({
      success: true,
      pricing,
    });
  } catch (error: any) {
    logger.error('Failed to fetch city pricing', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch city pricing' },
      { status: 500 }
    );
  }
}

// POST - Create or update city pricing (upsert)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vehicleCategoryId,
      locationId,
      baseKmRate,
      minKmPerDay,
      driverDayAllowance,
      driverNightAllowance,
      nightSurcharge,
      airportSurcharge,
      outstationMinDays,
      tollsIncluded,
      statePermitIncluded,
      parkingIncluded,
      isActive,
    } = body;

    if (!vehicleCategoryId || !locationId) {
      return NextResponse.json(
        { success: false, error: 'Vehicle category and location are required' },
        { status: 400 }
      );
    }

    if (!baseKmRate || baseKmRate <= 0) {
      return NextResponse.json(
        { success: false, error: 'Base per-km rate is required' },
        { status: 400 }
      );
    }

    // Upsert - create or update
    const pricing = await prisma.chauffeur_city_pricing.upsert({
      where: {
        vehicleCategoryId_locationId: {
          vehicleCategoryId,
          locationId,
        },
      },
      create: {
        vehicleCategoryId,
        locationId,
        baseKmRate,
        minKmPerDay: minKmPerDay || 250,
        driverDayAllowance: driverDayAllowance || 300,
        driverNightAllowance: driverNightAllowance || 250,
        nightSurcharge: nightSurcharge || 0,
        airportSurcharge: airportSurcharge || 0,
        outstationMinDays: outstationMinDays || 1,
        tollsIncluded: tollsIncluded || false,
        statePermitIncluded: statePermitIncluded || false,
        parkingIncluded: parkingIncluded || false,
        isActive: isActive !== false,
      },
      update: {
        baseKmRate,
        minKmPerDay: minKmPerDay || 250,
        driverDayAllowance: driverDayAllowance || 300,
        driverNightAllowance: driverNightAllowance || 250,
        nightSurcharge: nightSurcharge || 0,
        airportSurcharge: airportSurcharge || 0,
        outstationMinDays: outstationMinDays || 1,
        tollsIncluded: tollsIncluded || false,
        statePermitIncluded: statePermitIncluded || false,
        parkingIncluded: parkingIncluded || false,
        isActive: isActive !== false,
      },
      include: {
        chauffeur_vehicle_categories: { select: { id: true, name: true } },
        locations: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'City pricing saved successfully',
      pricing,
    });
  } catch (error: any) {
    logger.error('Failed to save city pricing', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save city pricing', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete city pricing
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Pricing ID is required' },
        { status: 400 }
      );
    }

    await prisma.chauffeur_city_pricing.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'City pricing deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete city pricing', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete city pricing', details: error?.message },
      { status: 500 }
    );
  }
}
