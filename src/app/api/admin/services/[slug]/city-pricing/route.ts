import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';
import { authorizeCarRentalContentAccess } from '@/lib/auth/car-rental-content-access';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate a unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// GET - List all city pricing configurations for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const serviceSlug = resolvedParams.slug;

    const access = await authorizeCarRentalContentAccess(serviceSlug);
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    }

    const { searchParams } = new URL(request.url);
    const vehicleCategoryId = searchParams.get('vehicleCategoryId');
    const locationId = searchParams.get('locationId');

    const where: any = {};
    if (vehicleCategoryId) where.vehicleCategoryId = vehicleCategoryId;
    if (locationId) where.locationId = locationId;

    // TODO: Filter by serviceSlug when field is added to model

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
      serviceSlug,
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
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const serviceSlug = resolvedParams.slug;

    const access = await authorizeCarRentalContentAccess(serviceSlug);
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    }

    const body = await request.json();
    const {
      vehicleCategoryId,
      locationId,
      locationIds, // For bulk create
      bulk,
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

    if (!vehicleCategoryId) {
      return NextResponse.json(
        { success: false, error: 'Vehicle category is required' },
        { status: 400 }
      );
    }

    if (!baseKmRate || baseKmRate <= 0) {
      return NextResponse.json(
        { success: false, error: 'Base per-km rate is required' },
        { status: 400 }
      );
    }

    const pricingData = {
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
    };

    // Bulk create — one entry per city in locationIds
    if (bulk && Array.isArray(locationIds) && locationIds.length > 0) {
      const results = await Promise.all(
        locationIds.map((locId: string) =>
          prisma.chauffeur_city_pricing.upsert({
            where: { vehicleCategoryId_locationId: { vehicleCategoryId, locationId: locId } },
            create: { id: generateId(), vehicleCategoryId, locationId: locId, ...pricingData },
            update: pricingData,
          })
        )
      );
      return NextResponse.json({
        success: true,
        message: `Bulk pricing saved for ${results.length} cities`,
        count: results.length,
        serviceSlug,
      });
    }

    // Single create/update
    if (!locationId) {
      return NextResponse.json(
        { success: false, error: 'Location is required' },
        { status: 400 }
      );
    }

    // Upsert - create or update
    const pricing = await prisma.chauffeur_city_pricing.upsert({
      where: { vehicleCategoryId_locationId: { vehicleCategoryId, locationId } },
      create: { id: generateId(), vehicleCategoryId, locationId, ...pricingData },
      update: pricingData,
      include: {
        chauffeur_vehicle_categories: { select: { id: true, name: true } },
        locations: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'City pricing saved successfully',
      pricing,
      serviceSlug,
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const serviceSlug = resolvedParams.slug;

    const access = await authorizeCarRentalContentAccess(serviceSlug);
    if (!access.ok) {
      return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    }

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
