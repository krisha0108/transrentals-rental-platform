import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - List all vehicle models
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const subServiceId = searchParams.get('subServiceId');
    const brandId = searchParams.get('brandId');

    const where: any = {};

    if (serviceId) {
      where.serviceId = serviceId;
    }
    if (subServiceId) {
      where.subServiceId = subServiceId;
    }
    if (brandId) {
      where.brandId = brandId;
    }

    const vehicleModels = await prisma.vehicle_models.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: {
        service: {
          select: { id: true, name: true, slug: true, parentId: true },
        },
        services_vehicle_models_subServiceIdToservices: {
          select: { id: true, name: true, slug: true },
        },
        brands: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        _count: {
          select: {
            vendor_fleets: true,
          },
        },
      },
    });

    // Map models - handle null brand gracefully
    const mappedModels = vehicleModels.map(model => ({
      ...model,
      brand: model.brands || { id: '', name: 'Unknown Brand', slug: '', logo: null },
    }));

    return NextResponse.json(mappedModels);
  } catch (error: any) {
    logger.error('Vehicle models list error', error);
    return NextResponse.json({ error: 'Failed to fetch vehicle models', details: error?.message }, { status: 500 });
  }
}

// POST - Create new vehicle model
export async function POST(request: NextRequest) {
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

    if (!name || !slug || !serviceId || !brandId) {
      return NextResponse.json({ error: 'Name, slug, service, and brand are required' }, { status: 400 });
    }

    // Validate service exists
    const service = await prisma.services.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 400 });
    }

    // Validate sub-service if provided
    if (subServiceId) {
      const sub_service = await prisma.services.findUnique({
        where: { id: subServiceId },
      });
      if (!sub_service || sub_service.parentId !== serviceId) {
        return NextResponse.json({ error: 'Invalid sub-service' }, { status: 400 });
      }
    }

    // Validate brand exists
    const brand = await prisma.brands.findUnique({
      where: { id: brandId },
    });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 400 });
    }

    // Check if slug already exists
    const existing = await prisma.vehicle_models.findFirst({
      where: {
        slug,
        serviceId,
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'A vehicle model with this slug already exists' }, { status: 400 });
    }

    const vehicle_model = await prisma.vehicle_models.create({
      data: {
        name,
        slug,
        serviceId,
        subServiceId: subServiceId || null,
        brandId,
        sideImage: sideImage || null,
        fuelType: fuelType || null,
        transmission: transmission || null,
        seatingCapacity: seatingCapacity || null,
        engineCC: engineCC || null,
        mileage: mileage || null,
        specs: specs || null,
        features: features || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        isActive: isActive !== false,
        displayOrder: displayOrder || 0,
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

    return NextResponse.json(vehicle_model, { status: 201 });
  } catch (error: any) {
    logger.error('Vehicle model create error', error);
    return NextResponse.json({ error: 'Failed to create vehicle model', details: error?.message }, { status: 500 });
  }
}
