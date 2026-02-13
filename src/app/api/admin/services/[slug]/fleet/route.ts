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

    // Get service-configured location IDs
    const serviceLocations = await prisma.service_locations.findMany({
      where: {
        serviceId: service.id,
        isActive: true,
      },
      select: {
        locationId: true,
      },
    });
    const serviceLocationIds = serviceLocations.map(sl => sl.locationId);

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
          chauffeur_vehicle_categories: {
            select: { id: true, name: true, slug: true },
          },
          vehicle_model_locations: {
            where: {
              isActive: true,
              locationId: { in: serviceLocationIds }, // Only count service-configured locations
            },
            select: { id: true },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vehicle_models.count({ where }),
    ]);

    // Fetch category mapping for vehicles that have subServiceId
    const vehicleIds = vehicles.map(v => v.id);
    const categoryMappings = await prisma.chauffeur_vehicle_categories.findMany({
      where: {
        id: { in: vehicles.map(v => v.subServiceId).filter(Boolean) as string[] },
        serviceId: service.id,
      },
      select: { id: true, name: true, slug: true },
    });

    // Create a category lookup map
    const categoryMap = new Map(categoryMappings.map(c => [c.id, c]));

    // Transform data
    const fleet = vehicles.map((v) => {
      // Parse specs JSON string to object
      let specsObj: any = null;
      if (v.specs) {
        try {
          specsObj = typeof v.specs === 'string' ? JSON.parse(v.specs) : v.specs;
        } catch (e) {
          console.error('Failed to parse specs JSON:', e);
          specsObj = null;
        }
      }

      // Try to get category name from multiple sources
      let categoryName = 'Uncategorized';
      let categoryId = v.subServiceId;

      // Priority 1: Check specs for stored category info
      if (specsObj && specsObj.categoryName) {
        categoryName = specsObj.categoryName;
        categoryId = specsObj.categoryId || categoryId;
      }
      // Priority 2: Check service relation
      else if (v.services_vehicle_models_subServiceIdToservices?.name) {
        categoryName = v.services_vehicle_models_subServiceIdToservices.name;
      }
      // Priority 3: Check category mapping
      else if (v.subServiceId && categoryMap.has(v.subServiceId)) {
        categoryName = categoryMap.get(v.subServiceId)!.name;
      }
      // Priority 4: Check chauffeur category relation
      else if ((v as any).chauffeur_vehicle_categories?.name) {
        categoryName = (v as any).chauffeur_vehicle_categories.name;
      }

      return {
        id: v.id,
        name: v.name,
        slug: v.slug,
        brand: v.brands?.name || 'Unknown',
        brandId: v.brandId,
        brandLogo: v.brands?.logo || null,
        services_vehicle_models_subServiceIdToservices: categoryName,
        subServiceId: categoryId,
        fuelType: v.fuelType,
        transmission: v.transmission,
        seatingCapacity: v.seatingCapacity,
        engineCC: v.engineCC,
        mileage: v.mileage,
        sideImage: v.sideImage,
        specs: specsObj,
        features: v.features,
        isActive: v.isActive,
        displayOrder: v.displayOrder,
        vendorCount: 0,
        locationCount: v.vehicle_model_locations?.length || 0,
        createdAt: v.createdAt,
        basePricePerDay: (v as any).basePricePerDay || 0,
        weeklyDiscount: (v as any).weeklyDiscount || 0,
        monthlyDiscount: (v as any).monthlyDiscount || 0,
      };
    });

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
      specs: bodySpecs,
      features,
      metaTitle,
      metaDescription,
      isActive,
      displayOrder,
      basePricePerDay,
      weeklyDiscount,
      monthlyDiscount,
      powerCapacity,
      loadCapacity,
      operatorIncluded,
      securityDeposit,
      specifications,
      weeklyRate,
      monthlyRate,
      vehicleCapacity,
      teamSize,
      registrationNumber,
    } = body;

    // Validate required fields
    if (!name || !vehicleSlug) {
      return NextResponse.json(
        { error: 'Name and slug are required', received: { name, vehicleSlug } },
        { status: 400 }
      );
    }

    // Brand is optional for equipment-rental and packers-and-movers
    const brandOptionalServices = ['equipment-rental', 'packers-and-movers'];
    const isBrandOptional = brandOptionalServices.includes(slug);

    // Ensure we have a brandId (create default if needed for optional services)
    let finalBrandId = brandId;

    if (!brandId && isBrandOptional) {
      // Create or find a default "Generic" brand for this service
      let defaultBrand = await prisma.brands.findFirst({
        where: {
          serviceId: service.id,
          slug: 'generic',
        },
      });

      if (!defaultBrand) {
        // Create default brand
        defaultBrand = await prisma.brands.create({
          data: {
            id: generateId(),
            name: 'Generic',
            slug: 'generic',
            serviceId: service.id,
            isActive: true,
            displayOrder: 9999,
          },
        });
        console.log('Created default brand for', slug, ':', defaultBrand.id);
      }

      finalBrandId = defaultBrand.id;
    }

    if (!isBrandOptional && !finalBrandId) {
      return NextResponse.json(
        { error: 'Brand is required for this service', received: { name, vehicleSlug, brandId } },
        { status: 400 }
      );
    }

    // Check if brand exists (if provided by user)
    if (brandId) {
      const brand = await prisma.brands.findUnique({
        where: { id: brandId },
      });

      if (!brand) {
        return NextResponse.json(
          { error: 'Brand not found', brandId },
          { status: 400 }
        );
      }

      // Verify brand belongs to this service
      if (brand.serviceId !== service.id) {
        return NextResponse.json(
          { error: 'Brand does not belong to this service' },
          { status: 400 }
        );
      }
    }

    // Validate subServiceId and get category info if provided
    let validSubServiceId: string | null = null;
    let categoryInfo: { id: string; name: string; slug: string } | null = null;

    if (subServiceId) {
      // Check if it's a vehicle category ID (for services that use categories)
      const vehicleCategory = await prisma.chauffeur_vehicle_categories.findFirst({
        where: {
          id: subServiceId,
          serviceId: service.id,
        },
      });

      if (vehicleCategory) {
        categoryInfo = {
          id: vehicleCategory.id,
          name: vehicleCategory.name,
          slug: vehicleCategory.slug,
        };

        // Try to find a corresponding service
        const categoryService = await prisma.services.findFirst({
          where: {
            slug: vehicleCategory.slug,
            parentId: service.id,
          },
        });
        validSubServiceId = categoryService?.id || null;
      } else {
        // Otherwise check if it's directly a service ID
        const sub_service = await prisma.services.findUnique({
          where: { id: subServiceId },
        });
        if (sub_service) {
          validSubServiceId = subServiceId;
          categoryInfo = {
            id: sub_service.id,
            name: sub_service.name,
            slug: sub_service.slug,
          };
        }
      }
    }

    // Build specs object to include category info and other fields
    const specsData: any = bodySpecs || {};

    // Store category info in specs if we have it
    if (categoryInfo) {
      specsData.categoryId = categoryInfo.id;
      specsData.categoryName = categoryInfo.name;
      specsData.categorySlug = categoryInfo.slug;
    }

    // Add service-specific fields to specs
    if (powerCapacity) specsData.powerCapacity = powerCapacity;
    if (loadCapacity) specsData.loadCapacity = loadCapacity;
    if (operatorIncluded !== undefined) specsData.operatorIncluded = String(operatorIncluded);
    if (securityDeposit) specsData.securityDeposit = securityDeposit;
    if (specifications) specsData.specifications = specifications;
    if (weeklyRate) specsData.weeklyRate = weeklyRate;
    if (monthlyRate) specsData.monthlyRate = monthlyRate;
    if (vehicleCapacity) specsData.vehicleCapacity = vehicleCapacity;
    if (teamSize) specsData.teamSize = teamSize;
    if (registrationNumber) specsData.registrationNumber = registrationNumber;
    if (engineCC) specsData.engineCC = engineCC;
    if (mileage) specsData.mileage = mileage;

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

    // Clean null values from specsData and convert to JSON string
    const cleanSpecs = Object.fromEntries(
      Object.entries(specsData).filter(([_, v]) => v !== null && v !== undefined)
    );

    // Create vehicle model with explicit ID
    const vehicle = await prisma.vehicle_models.create({
      data: {
        id: generateId(),
        name,
        slug: vehicleSlug,
        serviceId: service.id,
        subServiceId: validSubServiceId,
        brandId: finalBrandId,
        fuelType: fuelType || null,
        transmission: transmission || null,
        seatingCapacity: seatingCapacity ? parseInt(String(seatingCapacity)) : null,
        engineCC: engineCC ? parseInt(String(engineCC)) : null,
        mileage: mileage || null,
        sideImage: sideImage || null,
        specs: Object.keys(cleanSpecs).length > 0 ? JSON.stringify(cleanSpecs) : null,
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
