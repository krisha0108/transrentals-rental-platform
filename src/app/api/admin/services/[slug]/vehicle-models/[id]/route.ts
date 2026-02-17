import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get single vehicle model
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const model = await prisma.vehicle_models.findUnique({
      where: { id },
      include: {
        brands: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        services_vehicle_models_serviceIdToservices: {
          select: { id: true, name: true, slug: true },
        },
        services_vehicle_models_subServiceIdToservices: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { vendor_fleets: true },
        },
      },
    });

    if (!model) {
      return NextResponse.json({ error: 'Vehicle model not found' }, { status: 404 });
    }

    return NextResponse.json(model);
  } catch (error: any) {
    logger.error('Get vehicle model error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle model', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Update vehicle model
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { slug: serviceSlug, id } = await params;
    const body = await request.json();
    const {
      name,
      slug: modelSlug,
      brandId,
      subServiceId,
      vehicleCategoryId,
      sideImage,
      fuelType,
      transmission,
      seatingCapacity,
      engineCC,
      mileage,
      basePricePerDay,
      isActive,
      displayOrder,
      // Truck/Transporter specific fields
      loadCapacity,
      bodyType,
      wheels,
      lengthFt,
      widthFt,
      heightFt,
    } = body;

    // Find the service by slug
    const service = await prisma.services.findUnique({
      where: { slug: serviceSlug },
      select: { id: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Check if model exists
    const existing = await prisma.vehicle_models.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Vehicle model not found' }, { status: 404 });
    }

    // Check if new slug conflicts with another model within the same service
    if (modelSlug && modelSlug !== existing.slug) {
      const slugConflict = await prisma.vehicle_models.findFirst({
        where: {
          serviceId: service.id,
          slug: modelSlug,
          id: { not: id },
        },
      });

      if (slugConflict) {
        return NextResponse.json(
          { error: 'A vehicle model with this slug already exists in this service' },
          { status: 400 }
        );
      }
    }

    // Brand validation - optional for equipment-rental and packers-and-movers
    const brandOptionalServices = ['equipment-rental', 'packers-and-movers'];
    const isBrandOptional = brandOptionalServices.includes(serviceSlug);

    // If brandId is being updated and brand is not optional, it cannot be null
    if (!isBrandOptional && brandId !== undefined && !brandId) {
      return NextResponse.json(
        { error: 'Brand is required for this service' },
        { status: 400 }
      );
    }

    // Verify brand belongs to this service (if provided and not null)
    if (brandId && brandId !== existing.brandId) {
      const brand = await prisma.brands.findFirst({
        where: { id: brandId, serviceId: service.id },
      });

      if (!brand) {
        return NextResponse.json(
          { error: 'Brand does not belong to this service' },
          { status: 400 }
        );
      }
    }

    const model = await prisma.vehicle_models.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        slug: modelSlug !== undefined ? modelSlug : existing.slug,
        brandId: brandId !== undefined ? brandId : existing.brandId,
        subServiceId: subServiceId !== undefined ? subServiceId : existing.subServiceId,
        vehicleCategoryId: vehicleCategoryId !== undefined ? vehicleCategoryId : existing.vehicleCategoryId,
        sideImage: sideImage !== undefined ? sideImage : existing.sideImage,
        fuelType: fuelType !== undefined ? fuelType : existing.fuelType,
        transmission: transmission !== undefined ? transmission : existing.transmission,
        seatingCapacity: seatingCapacity !== undefined ? seatingCapacity : existing.seatingCapacity,
        engineCC: engineCC !== undefined ? engineCC : existing.engineCC,
        mileage: mileage !== undefined ? mileage : existing.mileage,
        basePricePerDay: basePricePerDay !== undefined ? basePricePerDay : existing.basePricePerDay,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
        // Truck/Transporter specific fields
        loadCapacity: loadCapacity !== undefined ? loadCapacity : existing.loadCapacity,
        bodyType: bodyType !== undefined ? bodyType : existing.bodyType,
        wheels: wheels !== undefined ? wheels : existing.wheels,
        lengthFt: lengthFt !== undefined ? lengthFt : existing.lengthFt,
        widthFt: widthFt !== undefined ? widthFt : existing.widthFt,
        heightFt: heightFt !== undefined ? heightFt : existing.heightFt,
      },
      include: {
        brands: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        chauffeur_vehicle_categories: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json(model);
  } catch (error: any) {
    logger.error('Update vehicle model error', error);
    return NextResponse.json(
      { error: 'Failed to update vehicle model', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete vehicle model
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await params;

    // Check if model has vendor fleets
    const model = await prisma.vehicle_models.findUnique({
      where: { id },
      include: {
        _count: {
          select: { vendor_fleets: true },
        },
      },
    });

    if (!model) {
      return NextResponse.json({ error: 'Vehicle model not found' }, { status: 404 });
    }

    if (model._count.vendor_fleets > 0) {
      return NextResponse.json(
        { error: 'Cannot delete model with vendor fleets. Remove vendor fleets first.' },
        { status: 400 }
      );
    }

    await prisma.vehicle_models.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Vehicle model deleted successfully' });
  } catch (error: any) {
    logger.error('Delete vehicle model error', error);
    return NextResponse.json(
      { error: 'Failed to delete vehicle model', details: error?.message },
      { status: 500 }
    );
  }
}
