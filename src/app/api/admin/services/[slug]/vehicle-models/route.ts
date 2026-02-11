import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// GET - List vehicle models for a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Find the service by slug
    const service = await prisma.services.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const where: any = {
      serviceId: service.id,
    };

    if (brandId) {
      where.brandId = brandId;
    }

    const [models, total] = await Promise.all([
      prisma.vehicle_models.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
        brands: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        services_vehicle_models_subServiceIdToservices: {
          select: { id: true, name: true, slug: true },
        },
        chauffeur_vehicle_categories: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { vendor_fleets: true },
        },
      },
      }),
      prisma.vehicle_models.count({ where }),
    ]);

    // Map models - handle null brand gracefully
    const mappedModels = models.map(model => ({
      ...model,
      brand: model.brands || { id: '', name: 'Unknown Brand', slug: '', logo: null },
    }));

    return NextResponse.json({
      models: mappedModels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Vehicle models list error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle models', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create new vehicle model for this service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
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

    const { slug } = await params;

    // Find the service by slug
    const service = await prisma.services.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

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
    } = body;

    if (!name || !modelSlug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Brand is optional for equipment-rental and packers-and-movers
    const brandOptionalServices = ['equipment-rental', 'packers-and-movers'];
    const isBrandOptional = brandOptionalServices.includes(slug);

    if (!isBrandOptional && !brandId) {
      return NextResponse.json(
        { error: 'Brand is required for this service' },
        { status: 400 }
      );
    }

    // Verify brand belongs to this service (if provided)
    if (brandId) {
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

    // Check if slug already exists within this service
    const existing = await prisma.vehicle_models.findFirst({
      where: {
        serviceId: service.id,
        slug: modelSlug,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A vehicle model with this slug already exists in this service' },
        { status: 400 }
      );
    }

    const model = await prisma.vehicle_models.create({
      data: {
        id: generateId(),
        name,
        slug: modelSlug,
        brandId,
        serviceId: service.id,
        subServiceId: subServiceId || null,
        vehicleCategoryId: vehicleCategoryId || null,
        sideImage: sideImage || null,
        fuelType: fuelType || null,
        transmission: transmission || null,
        seatingCapacity: seatingCapacity || null,
        engineCC: engineCC || null,
        mileage: mileage || null,
        basePricePerDay: basePricePerDay || null,
        isActive: isActive !== false,
        displayOrder: displayOrder || 0,
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

    return NextResponse.json(model, { status: 201 });
  } catch (error: any) {
    logger.error('Vehicle model create error', error);
    return NextResponse.json(
      { error: 'Failed to create vehicle model', details: error?.message },
      { status: 500 }
    );
  }
}
