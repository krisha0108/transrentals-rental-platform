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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const vehicle_model = await prisma.vehicle_models.findUnique({
      where: { id },
      include: {
        service: {
          select: { id: true, name: true, slug: true },
        },
        services_vehicle_models_subServiceIdToservices: {
          select: { id: true, name: true, slug: true },
        },
        brands: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        vendor_fleets: {
          include: {
            vendor_fleet_locations: {
              include: {
                locations: true,
              },
            },
          },
        },
        _count: {
          select: {
            vendor_fleets: true,
          },
        },
      },
    });

    if (!vehicle_model) {
      return NextResponse.json({ error: 'Vehicle model not found' }, { status: 404 });
    }

    return NextResponse.json(vehicle_model);
  } catch (error: any) {
    logger.error('Vehicle model get error', error);
    return NextResponse.json({ error: 'Failed to fetch vehicle model', details: error?.message }, { status: 500 });
  }
}

// PUT - Update vehicle model
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const existing = await prisma.vehicle_models.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Vehicle model not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      serviceId,
      subServiceId,
      brandId,
      sideImage,
      fuelType,
      transmission,
      seatingCapacity,
      engineCC,
      mileage,
      specs,
      features,
      metaTitle,
      metaDescription,
      isActive,
      displayOrder,
    } = body;

    // Check if new slug conflicts
    if (slug && slug !== existing.slug) {
      const slugConflict = await prisma.vehicle_models.findFirst({
        where: {
          slug,
          serviceId: existing.serviceId,
        },
      });
      if (slugConflict) {
        return NextResponse.json({ error: 'A vehicle model with this slug already exists' }, { status: 400 });
      }
    }

    // Validate service if changed
    if (serviceId && serviceId !== existing.serviceId) {
      const service = await prisma.services.findUnique({
        where: { id: serviceId },
      });
      if (!service) {
        return NextResponse.json({ error: 'Service not found' }, { status: 400 });
      }
    }

    // Validate brand if changed
    if (brandId && brandId !== existing.brandId) {
      const brand = await prisma.brands.findUnique({
        where: { id: brandId },
      });
      if (!brand) {
        return NextResponse.json({ error: 'Brand not found' }, { status: 400 });
      }
    }

    const vehicle_model = await prisma.vehicle_models.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        slug: slug !== undefined ? slug : existing.slug,
        serviceId: serviceId !== undefined ? serviceId : existing.serviceId,
        subServiceId: subServiceId !== undefined ? subServiceId : existing.subServiceId,
        brandId: brandId !== undefined ? brandId : existing.brandId,
        sideImage: sideImage !== undefined ? sideImage : existing.sideImage,
        fuelType: fuelType !== undefined ? fuelType : existing.fuelType,
        transmission: transmission !== undefined ? transmission : existing.transmission,
        seatingCapacity: seatingCapacity !== undefined ? seatingCapacity : existing.seatingCapacity,
        engineCC: engineCC !== undefined ? engineCC : existing.engineCC,
        mileage: mileage !== undefined ? mileage : existing.mileage,
        specs: specs !== undefined ? specs : existing.specs,
        features: features !== undefined ? features : existing.features,
        metaTitle: metaTitle !== undefined ? metaTitle : existing.metaTitle,
        metaDescription: metaDescription !== undefined ? metaDescription : existing.metaDescription,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
      },
      include: {
        service: {
          select: { id: true, name: true, slug: true },
        },
        services_vehicle_models_subServiceIdToservices: {
          select: { id: true, name: true, slug: true },
        },
        brands: {
          select: { id: true, name: true, slug: true, logo: true },
        },
      },
    });

    return NextResponse.json(vehicle_model);
  } catch (error: any) {
    logger.error('Vehicle model update error', error);
    return NextResponse.json({ error: 'Failed to update vehicle model', details: error?.message }, { status: 500 });
  }
}

// DELETE - Delete vehicle model
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const existing = await prisma.vehicle_models.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            vendor_fleets: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Vehicle model not found' }, { status: 404 });
    }

    if (existing._count.vendor_fleets > 0) {
      return NextResponse.json({
        error: 'Cannot delete vehicle model with vendor fleets. Delete vendor fleets first.'
      }, { status: 400 });
    }

    await prisma.vehicle_models.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Vehicle model delete error', error);
    return NextResponse.json({ error: 'Failed to delete vehicle model', details: error?.message }, { status: 500 });
  }
}
