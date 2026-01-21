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

// GET - Get fleet/vehicles for a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { slug } = resolvedParams;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const subServiceId = searchParams.get('subServiceId') || '';
    const status = searchParams.get('status') || '';

    // Find the service by slug
    const service = await prisma.services.findUnique({
      where: { slug },
      include: {
        other_services: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Fetch vehicle categories for this service
    const vehicleCategories = await prisma.chauffeur_vehicle_categories.findMany({
      where: {
        serviceId: service.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Build where clause for vehicle models
    const where: any = {
      serviceId: service.id,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { brands: { name: { contains: search } } },
      ];
    }

    if (subServiceId) {
      where.subServiceId = subServiceId;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Fetch vehicle models for this service
    const [vehicles, total] = await Promise.all([
      prisma.vehicle_models.findMany({
        where,
        include: {
          brands: {
            select: { id: true, name: true, slug: true, logo: true },
          },
          services_vehicle_models_subServiceIdToservices: {
            select: { id: true, name: true, slug: true },
          },
          vehicle_model_locations: {
            where: { isActive: true },
            select: { id: true },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vehicle_models.count({ where }),
    ]);

    // Transform data
    const fleet = vehicles.map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      brand: v.brands?.name || 'Unknown',
      brandId: v.brandId,
      brandLogo: v.brands?.logo || null,
      services_vehicle_models_subServiceIdToservices: v.services_vehicle_models_subServiceIdToservices?.name || 'Uncategorized',
      subServiceId: v.subServiceId,
      fuelType: v.fuelType,
      transmission: v.transmission,
      seatingCapacity: v.seatingCapacity,
      engineCC: v.engineCC,
      mileage: v.mileage,
      sideImage: v.sideImage,
      specs: v.specs,
      features: v.features,
      isActive: v.isActive,
      displayOrder: v.displayOrder,
      vendorCount: 0,
      locationCount: v.vehicle_model_locations?.length || 0,
      createdAt: v.createdAt,
      basePricePerDay: (v as any).basePricePerDay || 0,
      weeklyDiscount: (v as any).weeklyDiscount || 0,
      monthlyDiscount: (v as any).monthlyDiscount || 0,
    }));

    return NextResponse.json({
      success: true,
      fleet,
      // Use vehicle categories as subServices (for category dropdown)
      subServices: vehicleCategories.length > 0 ? vehicleCategories : service.other_services,
      vehicleCategories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Service fleet error', error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      { error: 'Failed to fetch fleet', details: error?.message, stack: error?.stack },
      { status: 500 }
    );
  }
}

// POST - Add new vehicle model to service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { slug } = resolvedParams;

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      logger.error('JSON parse error', parseError);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    console.log('POST fleet - slug:', slug);
    console.log('POST fleet - body:', JSON.stringify(body, null, 2));

    // Find the service
    const service = await prisma.services.findUnique({
      where: { slug },
    });

    console.log('POST fleet - service found:', service?.id);

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

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

    // Validate required fields
    if (!name || !vehicleSlug || !brandId) {
      return NextResponse.json(
        { error: 'Name, slug, and brand are required', received: { name, vehicleSlug, brandId } },
        { status: 400 }
      );
    }

    // Check if brand exists
    const brand = await prisma.brands.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      return NextResponse.json(
        { error: 'Brand not found', brandId },
        { status: 400 }
      );
    }

    // Validate subServiceId if provided
    let validSubServiceId: string | null = null;
    if (subServiceId) {
      const sub_service = await prisma.services.findUnique({
        where: { id: subServiceId },
      });
      if (sub_service) {
        validSubServiceId = subServiceId;
      } else {
        console.log('SubService not found, ignoring:', subServiceId);
      }
    }

    // Check if slug exists
    const existing = await prisma.vehicle_models.findFirst({
      where: {
        slug: vehicleSlug,
        serviceId: service.id,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A vehicle with this slug already exists' },
        { status: 400 }
      );
    }

    // Create vehicle model with explicit ID
    const vehicle = await prisma.vehicle_models.create({
      data: {
        id: generateId(),
        name,
        slug: vehicleSlug,
        serviceId: service.id,
        subServiceId: validSubServiceId,
        brandId,
        fuelType: fuelType || null,
        transmission: transmission || null,
        seatingCapacity: seatingCapacity ? parseInt(String(seatingCapacity)) : null,
        engineCC: engineCC ? parseInt(String(engineCC)) : null,
        mileage: mileage || null,
        sideImage: sideImage || null,
        specs: specs || null,
        features: features || null,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        isActive: isActive !== false,
        displayOrder: displayOrder || 0,
        basePricePerDay: basePricePerDay ? parseFloat(String(basePricePerDay)) : null,
        weeklyDiscount: weeklyDiscount ? parseFloat(String(weeklyDiscount)) : null,
        monthlyDiscount: monthlyDiscount ? parseFloat(String(monthlyDiscount)) : null,
      },
      include: {
        brands: true,
        services_vehicle_models_subServiceIdToservices: true,
      },
    });

    return NextResponse.json({ success: true, vehicle }, { status: 201 });
  } catch (error: any) {
    logger.error('Service fleet create error', error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      { error: 'Failed to create vehicle', details: error?.message, stack: error?.stack },
      { status: 500 }
    );
  }
}
