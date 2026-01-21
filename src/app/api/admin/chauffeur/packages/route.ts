import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List all local packages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleCategoryId = searchParams.get('vehicleCategoryId');
    const locationId = searchParams.get('locationId');

    const where: any = {};
    if (vehicleCategoryId) where.vehicleCategoryId = vehicleCategoryId;
    if (locationId) where.locationId = locationId;

    const packages = await prisma.chauffeur_local_packages.findMany({
      where,
      include: {
        chauffeur_vehicle_categories: { select: { id: true, name: true, slug: true } },
        locations: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [
        { chauffeur_vehicle_categories: { displayOrder: 'asc' } },
        { displayOrder: 'asc' },
        { hours: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      packages,
    });
  } catch (error: any) {
    logger.error('Failed to fetch local packages', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch local packages' },
      { status: 500 }
    );
  }
}

// POST - Create new local package
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vehicleCategoryId,
      locationId,
      name,
      hours,
      kms,
      basePrice,
      extraKmCharge,
      extraHourCharge,
      nightChargesApply,
      nightChargeAmount,
      isPopular,
      displayOrder,
      isActive,
    } = body;

    if (!vehicleCategoryId || !hours || !kms || !basePrice) {
      return NextResponse.json(
        { success: false, error: 'Vehicle category, hours, kms, and base price are required' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.chauffeur_local_packages.findFirst({
      where: {
        vehicleCategoryId,
        locationId: locationId || null,
        hours,
        kms,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A package with this configuration already exists' },
        { status: 400 }
      );
    }

    const pkg = await prisma.chauffeur_local_packages.create({
      data: {
        vehicleCategoryId,
        locationId: locationId || null,
        name: name || `${hours}hr/${kms}km`,
        hours,
        kms,
        basePrice,
        extraKmCharge: extraKmCharge || 0,
        extraHourCharge: extraHourCharge || 0,
        nightChargesApply: nightChargesApply !== false,
        nightChargeAmount: nightChargeAmount || 150,
        isPopular: isPopular || false,
        displayOrder: displayOrder || 0,
        isActive: isActive !== false,
      },
      include: {
        chauffeur_vehicle_categories: { select: { id: true, name: true } },
        locations: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Local package created successfully',
      package: pkg,
    });
  } catch (error: any) {
    logger.error('Failed to create local package', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create local package', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update local package
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      hours,
      kms,
      basePrice,
      extraKmCharge,
      extraHourCharge,
      nightChargesApply,
      nightChargeAmount,
      isPopular,
      displayOrder,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      );
    }

    const pkg = await prisma.chauffeur_local_packages.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(hours !== undefined && { hours }),
        ...(kms !== undefined && { kms }),
        ...(basePrice !== undefined && { basePrice }),
        ...(extraKmCharge !== undefined && { extraKmCharge }),
        ...(extraHourCharge !== undefined && { extraHourCharge }),
        ...(nightChargesApply !== undefined && { nightChargesApply }),
        ...(nightChargeAmount !== undefined && { nightChargeAmount }),
        ...(isPopular !== undefined && { isPopular }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        chauffeur_vehicle_categories: { select: { id: true, name: true } },
        locations: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Local package updated successfully',
      package: pkg,
    });
  } catch (error: any) {
    logger.error('Failed to update local package', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update local package', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete local package
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      );
    }

    await prisma.chauffeur_local_packages.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Local package deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete local package', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete local package', details: error?.message },
      { status: 500 }
    );
  }
}
