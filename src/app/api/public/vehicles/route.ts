import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get vehicles for public display (by service/location)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceSlug = searchParams.get('service');
    const locationSlug = searchParams.get('location');
    const subServiceSlug = searchParams.get('sub_service');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const where: any = {
      isActive: true,
    };

    // Filter by service if provided
    if (serviceSlug) {
      const service = await prisma.services.findUnique({
        where: { slug: serviceSlug },
      });
      if (service) {
        where.serviceId = service.id;
      }
    }

    // Filter by sub_service if provided
    if (subServiceSlug) {
      const sub_service = await prisma.services.findFirst({
        where: { slug: subServiceSlug },
      });
      if (sub_service) {
        where.subServiceId = sub_service.id;
      }
    }

    // Filter by location availability if provided
    if (locationSlug) {
      const location = await prisma.locations.findFirst({
        where: { slug: locationSlug },
      });
      if (location) {
        where.vehicle_model_locations = {
          some: {
            locationId: location.id,
            isActive: true,
          },
        };
      }
    }

    // Fetch vehicles
    const [vehicles, total] = await Promise.all([
      prisma.vehicle_models.findMany({
        where,
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
          vehicle_model_locations: locationSlug
            ? {
                where: {
                  locations: { slug: locationSlug },
                  isActive: true,
                },
                include: {
                  locations: {
                    select: { id: true, name: true, slug: true },
                  },
                },
              }
            : {
                where: { isActive: true },
                include: {
                  locations: {
                    select: { id: true, name: true, slug: true },
                  },
                },
                take: 5,
              },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vehicle_models.count({ where }),
    ]);

    // Transform data for public consumption
    const transformedVehicles = vehicles.map((v) => {
      // Get location-specific price or default price
      const locationData = v.vehicle_model_locations?.[0];
      const pricePerDay = locationData?.basePricePerDay || v.basePricePerDay || 0;
      const serviceData = v.services_vehicle_models_serviceIdToservices;

      return {
        id: v.id,
        name: v.name,
        slug: v.slug,
        brand: v.brands?.name || 'Unknown',
        brandSlug: v.brands?.slug,
        brandLogo: v.brands?.logo,
        category: v.services_vehicle_models_subServiceIdToservices?.name || serviceData?.name || 'Uncategorized',
        categorySlug: v.services_vehicle_models_subServiceIdToservices?.slug || serviceData?.slug,
        service: serviceData?.name,
        serviceSlug: serviceData?.slug,
        image: v.sideImage || '/images/fleet/default-vehicle.jpg',
        pricePerDay,
        pricePerHour: Math.round(pricePerDay / 8),
        weeklyDiscount: v.weeklyDiscount || 0,
        monthlyDiscount: v.monthlyDiscount || 0,
        fuelType: v.fuelType,
        transmission: v.transmission,
        seatingCapacity: v.seatingCapacity,
        engineCC: v.engineCC,
        mileage: v.mileage,
        specs: v.specs,
        features: v.features || [],
        locationCount: v.vehicle_model_locations?.length || 0,
        available: true,
      };
    });

    return NextResponse.json({
      success: true,
      vehicles: transformedVehicles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Public vehicles API error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicles', details: error?.message },
      { status: 500 }
    );
  }
}
