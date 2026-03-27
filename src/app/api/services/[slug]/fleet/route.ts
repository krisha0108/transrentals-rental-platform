import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Public endpoint to get fleet/vehicles for a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { slug } = resolvedParams;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const subServiceSlug = searchParams.get('sub_service') || '';
    const locationSlug = searchParams.get('location') || '';

    // Find the service by slug
    const service = await prisma.services.findUnique({
      where: { slug },
      include: {
        other_services: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true, icon: true, shortDesc: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found', fleet: [], categories: [] },
        { status: 404 }
      );
    }

    // Build where clause for vehicle models
    const where: any = {
      serviceId: service.id,
      isActive: true,
      brands: {
        isActive: true,
      },
    };

    where.AND = [
      {
        OR: [
          { vehicleCategoryId: null },
          { chauffeur_vehicle_categories: { isActive: true } },
        ],
      },
      {
        OR: [
          { subServiceId: null },
          { services_vehicle_models_subServiceIdToservices: { isActive: true } },
        ],
      },
    ];

    if (subServiceSlug) {
      const sub_service = await prisma.services.findUnique({
        where: { slug: subServiceSlug },
      });
      if (sub_service) {
        where.subServiceId = sub_service.id;
      }
    }

    // Handle location-based filtering
    if (locationSlug) {
      const city = await prisma.locations.findUnique({
        where: { slug: locationSlug },
      });

      if (city) {
        where.vehicle_model_locations = {
          some: {
            locationId: city.id,
            isActive: true,
          },
        };
      }
    }

    // Fetch vehicle models for this service
    const vehicles = await prisma.vehicle_models.findMany({
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
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      take: limit,
    });

    // Transform data for public consumption
    const fleet = vehicles.map((v) => {
      // Logic for category name:
      // 1. subService (linked from CRM)
      // 2. chauffeur category (linked from local DB)
      // 3. bodyType
      // 4. Fallback to 'Uncategorized'
      let categoryName = 'Uncategorized';
      let categorySlug = null;

      if (v.services_vehicle_models_subServiceIdToservices) {
        categoryName = v.services_vehicle_models_subServiceIdToservices.name;
        categorySlug = v.services_vehicle_models_subServiceIdToservices.slug;
      } else if (v.chauffeur_vehicle_categories) {
        // Only use if not dummy data (check for random strings)
        const name = v.chauffeur_vehicle_categories.name;
        if (name && name.length > 3 && !/^[a-z0-9]+$/i.test(name)) {
          categoryName = name;
          categorySlug = v.chauffeur_vehicle_categories.slug;
        } else if (v.bodyType) {
          categoryName = v.bodyType;
          categorySlug = v.bodyType.toLowerCase().replace(/\s+/g, '-');
        } else if (name) {
          categoryName = name;
          categorySlug = v.chauffeur_vehicle_categories.slug;
        }
      } else if (v.bodyType) {
        categoryName = v.bodyType;
        categorySlug = v.bodyType.toLowerCase().replace(/\s+/g, '-');
      }

      return {
        id: v.id,
        name: v.name,
        slug: v.slug,
        brand: v.brands?.name || 'Unknown',
        brandLogo: v.brands?.logo || null,
        category: categoryName,
        categorySlug: categorySlug,
        fuelType: v.fuelType,
        transmission: v.transmission,
        seatingCapacity: v.seatingCapacity,
        engineCC: v.engineCC,
        mileage: v.mileage,
        image: v.sideImage,
        specs: v.specs,
        features: v.features,
        basePricePerDay: (v as any).basePricePerDay || null,
      };
    });

    // Build categories from actual fleet data so filters always match
    const categoryMap = new Map<string, { id: string; name: string; slug: string; icon: string | null; description: string | null }>();
    for (const v of fleet) {
      if (v.categorySlug && v.category && v.category !== 'Uncategorized') {
        if (!categoryMap.has(v.categorySlug)) {
          // Try to match with a sub-service for icon/description
          const subService = service.other_services.find((s) => s.slug === v.categorySlug);
          categoryMap.set(v.categorySlug, {
            id: subService?.id || v.categorySlug,
            name: v.category,
            slug: v.categorySlug,
            icon: subService?.icon || null,
            description: subService?.shortDesc || null,
          });
        }
      }
    }
    const categories = Array.from(categoryMap.values());

    return NextResponse.json({
      success: true,
      service: {
        id: service.id,
        name: service.name,
        slug: service.slug,
      },
      fleet,
      categories,
      total: fleet.length,
    });
  } catch (error: any) {
    logger.error('Service fleet public API error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch fleet', details: error?.message },
      { status: 500 }
    );
  }
}
