import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get single vehicle details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> | { slug: string; id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;

    const vehicle = await prisma.vehicle_models.findUnique({
      where: { id },
      include: {
        brands: true,
        services_vehicle_models_serviceIdToservices: true,
        services_vehicle_models_subServiceIdToservices: true,
        vehicle_model_locations: {
          include: {
            locations: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        vendor_fleets: {
          include: {
            vendors: {
              select: { id: true, businessName: true },
            },
            vendor_fleet_locations: {
              include: {
                locations: true,
              },
            },
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, vehicle });
  } catch (error: any) {
    logger.error('Vehicle fetch error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update vehicle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> | { slug: string; id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;
    const body = await request.json();

    const {
      name,
      vehicleSlug,
      brandId,
      subServiceId,
      fuelType,
      transmission,
      seatingCapacity,
      engineCC,
      mileage,
      sideImage,
      specs,
      features,
      metaTitle,
      metaDescription,
      isActive,
      displayOrder,
      basePricePerDay,
      weeklyDiscount,
      monthlyDiscount,
    } = body;

    // Check if vehicle exists
    const existing = await prisma.vehicle_models.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Check if new slug conflicts with another vehicle
    if (vehicleSlug && vehicleSlug !== existing.slug) {
      const slugConflict = await prisma.vehicle_models.findFirst({
        where: {
          slug: vehicleSlug,
          serviceId: existing.serviceId,
        },
      });
      if (slugConflict) {
        return NextResponse.json(
          { error: 'A vehicle with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Validate subServiceId if provided - it must exist in services table (FK constraint)
    let validSubServiceId = existing.subServiceId;
    if (subServiceId !== undefined) {
      if (!subServiceId || subServiceId === '') {
        validSubServiceId = null;
      } else {
        // Check if it's a valid service ID (FK constraint only allows services)
        const subService = await prisma.services.findUnique({ where: { id: subServiceId } });
        if (subService) {
          validSubServiceId = subServiceId;
        } else {
          // Not a valid service ID, keep existing or set to null
          console.log('Invalid subServiceId provided:', subServiceId, '- keeping existing value');
          validSubServiceId = existing.subServiceId;
        }
      }
    }

    console.log('Updating vehicle:', id, 'with data:', {
      name: name ?? existing.name,
      brandId: brandId ?? existing.brandId,
      subServiceId: validSubServiceId,
    });

    // Helper to safely parse integers
    const safeParseInt = (val: any): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const parsed = typeof val === 'number' ? val : parseInt(String(val), 10);
      return isNaN(parsed) ? null : parsed;
    };

    // Helper to safely parse floats
    const safeParseFloat = (val: any): number | null => {
      if (val === null || val === undefined || val === '') return null;
      const parsed = typeof val === 'number' ? val : parseFloat(String(val));
      return isNaN(parsed) ? null : parsed;
    };

    const vehicle = await prisma.vehicle_models.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        slug: vehicleSlug ?? existing.slug,
        brandId: brandId ?? existing.brandId,
        subServiceId: validSubServiceId,
        fuelType: fuelType !== undefined ? fuelType : existing.fuelType,
        transmission: transmission !== undefined ? transmission : existing.transmission,
        seatingCapacity: seatingCapacity !== undefined ? safeParseInt(seatingCapacity) : existing.seatingCapacity,
        engineCC: engineCC !== undefined ? safeParseInt(engineCC) : existing.engineCC,
        mileage: mileage !== undefined ? mileage : existing.mileage,
        sideImage: sideImage !== undefined ? sideImage : existing.sideImage,
        specs: specs !== undefined ? specs : existing.specs,
        features: features !== undefined ? features : existing.features,
        metaTitle: metaTitle !== undefined ? metaTitle : existing.metaTitle,
        metaDescription: metaDescription !== undefined ? metaDescription : existing.metaDescription,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
        basePricePerDay: basePricePerDay !== undefined ? safeParseFloat(basePricePerDay) : (existing as any).basePricePerDay,
        weeklyDiscount: weeklyDiscount !== undefined ? safeParseFloat(weeklyDiscount) : (existing as any).weeklyDiscount,
        monthlyDiscount: monthlyDiscount !== undefined ? safeParseFloat(monthlyDiscount) : (existing as any).monthlyDiscount,
      },
      include: {
        brands: true,
        services_vehicle_models_subServiceIdToservices: true,
      },
    });

    return NextResponse.json({ success: true, vehicle });
  } catch (error: any) {
    logger.error('Vehicle update error', error);
    console.error('Vehicle update error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack?.split('\n').slice(0, 5),
    });
    return NextResponse.json(
      { error: 'Failed to update vehicle', details: error?.message, code: error?.code },
      { status: 500 }
    );
  }
}

// DELETE - Delete vehicle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> | { slug: string; id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { id } = resolvedParams;

    // Check if vehicle exists
    const existing = await prisma.vehicle_models.findUnique({
      where: { id },
      include: {
        vendor_fleets: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Check if vehicle has vendor fleets
    if (existing.vendor_fleets.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${existing.vendor_fleets.length} vendor(s) have this vehicle in their fleet` },
        { status: 400 }
      );
    }

    await prisma.vehicle_models.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error: any) {
    logger.error('Vehicle delete error', error);
    return NextResponse.json(
      { error: 'Failed to delete vehicle', details: error?.message },
      { status: 500 }
    );
  }
}
