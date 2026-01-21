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
    };

    if (subServiceSlug) {
      const sub_service = await prisma.services.findUnique({
        where: { slug: subServiceSlug },
      });
      if (sub_service) {
        where.subServiceId = sub_service.id;
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
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      take: limit,
    });

    // Transform data for public consumption
    const fleet = vehicles.map((v) => ({
      id: v.id,
      name: v.name,
      slug: v.slug,
      brand: v.brands?.name || 'Unknown',
      brandLogo: v.brands?.logo || null,
      category: v.services_vehicle_models_subServiceIdToservices?.name || 'Uncategorized',
      categorySlug: v.services_vehicle_models_subServiceIdToservices?.slug || null,
      fuelType: v.fuelType,
      transmission: v.transmission,
      seatingCapacity: v.seatingCapacity,
      engineCC: v.engineCC,
      mileage: v.mileage,
      image: v.sideImage,
      specs: v.specs,
      features: v.features,
      basePricePerDay: (v as any).basePricePerDay || null,
    }));

    // Get categories (sub-services) for this service
    const categories = service.other_services.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      description: c.shortDesc,
    }));

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
