import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// GET - List local packages for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: serviceSlug } = await params;

    const packages = await prisma.chauffeur_local_packages.findMany({
      orderBy: [
        { chauffeur_vehicle_categories: { displayOrder: 'asc' } },
        { displayOrder: 'asc' },
        { hours: 'asc' },
      ],
      include: {
        chauffeur_vehicle_categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        locations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      serviceSlug,
      packages: packages.map((p) => ({
        id: p.id,
        vehicleCategoryId: p.vehicleCategoryId,
        locationId: p.locationId,
        name: p.name,
        hours: p.hours,
        kms: p.kms,
        basePrice: p.basePrice,
        extraKmCharge: p.extraKmCharge,
        extraHourCharge: p.extraHourCharge,
        nightChargesApply: p.nightChargesApply,
        nightChargeAmount: p.nightChargeAmount,
        isPopular: p.isPopular,
        displayOrder: p.displayOrder,
        isActive: p.isActive,
        chauffeur_vehicle_categories: p.chauffeur_vehicle_categories,
        location: p.locations,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch packages', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

// POST - Create new local package
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: serviceSlug } = await params;
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

    if (!vehicleCategoryId || !hours || !kms || basePrice === undefined) {
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
        { success: false, error: 'Package with same hours/kms already exists for this vehicle category' },
        { status: 400 }
      );
    }

    const pkg = await prisma.chauffeur_local_packages.create({
      data: {
        id: generateId(),
        vehicleCategoryId,
        locationId: locationId || null,
        name: name || `${hours}hr/${kms}km`,
        hours,
        kms,
        basePrice,
        extraKmCharge: extraKmCharge || 12,
        extraHourCharge: extraHourCharge || 100,
        nightChargesApply: nightChargesApply !== false,
        nightChargeAmount: nightChargeAmount || 150,
        isPopular: isPopular || false,
        displayOrder: displayOrder || 0,
        isActive: isActive !== false,
      },
      include: {
        chauffeur_vehicle_categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        locations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Package created successfully',
      package: pkg,
      serviceSlug,
    });
  } catch (error: any) {
    logger.error('Failed to create package', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create package', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update existing package
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: serviceSlug } = await params;
    const body = await request.json();
    const {
      id,
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

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Package ID is required' },
        { status: 400 }
      );
    }

    // Auto-update name when hours or kms change
    const finalHours = hours !== undefined ? hours : undefined;
    const finalKms = kms !== undefined ? kms : undefined;
    let finalName = name;
    if (finalHours !== undefined || finalKms !== undefined) {
      // Fetch existing to fill in missing values
      const existing = await prisma.chauffeur_local_packages.findUnique({ where: { id } });
      if (existing) {
        const h = finalHours !== undefined ? finalHours : existing.hours;
        const k = finalKms !== undefined ? finalKms : existing.kms;
        finalName = `${h}hr/${k}km`;
      }
    }

    const updateData: any = {};
    if (vehicleCategoryId !== undefined) updateData.vehicleCategoryId = vehicleCategoryId;
    if (locationId !== undefined) updateData.locationId = locationId || null;
    if (finalName !== undefined) updateData.name = finalName;
    if (finalHours !== undefined) updateData.hours = finalHours;
    if (finalKms !== undefined) updateData.kms = finalKms;
    if (basePrice !== undefined) updateData.basePrice = basePrice;
    if (extraKmCharge !== undefined) updateData.extraKmCharge = extraKmCharge;
    if (extraHourCharge !== undefined) updateData.extraHourCharge = extraHourCharge;
    if (nightChargesApply !== undefined) updateData.nightChargesApply = nightChargesApply;
    if (nightChargeAmount !== undefined) updateData.nightChargeAmount = nightChargeAmount;
    if (isPopular !== undefined) updateData.isPopular = isPopular;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    const pkg = await prisma.chauffeur_local_packages.update({
      where: { id },
      data: updateData,
      include: {
        chauffeur_vehicle_categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        locations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Package updated successfully',
      package: pkg,
    });
  } catch (error: any) {
    logger.error('Failed to update package', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update package', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete package
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
      message: 'Package deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete package', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete package', details: error?.message },
      { status: 500 }
    );
  }
}
