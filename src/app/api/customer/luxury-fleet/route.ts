import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

/**
 * GET - Get luxury fleet for customer app
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') || '';
    const featured = searchParams.get('featured') === 'true';

    const where: any = {
      isActive: true,
      vehicleType: 'luxury-car' // Filter for luxury cars
    };

    if (featured) {
      where.isFeatured = true;
    }

    // Get luxury vehicles
    const vehicles = await prisma.fleet.findMany({
      where,
      include: {
        fleet_categories: true,
        fleet_location_rates: location
          ? {
              where: {
                fleet_locations: { slug: location },
                isActive: true,
              },
              include: { fleet_locations: true },
            }
          : {
              where: { isActive: true },
              include: { fleet_locations: true },
              take: 1,
              orderBy: { dailyRate: 'asc' },
            },
        fleet_availability: location
          ? {
              where: {
                fleet_locations: { slug: location },
              },
              include: { fleet_locations: true },
            }
          : false,
      },
      orderBy: [{ priority: 'desc' }, { basePrice: 'desc' }],
      take: 50,
    });

    // Transform data
    const result = vehicles.map((vehicle) => {
      const locationRate = (vehicle.fleet_location_rates as any)?.[0];
      const locationAvailability = (vehicle.fleet_availability as any)?.[0];

      // For SPECIFIC_LOCATIONS type, check if available in this location
      if (vehicle.availabilityType === 'SPECIFIC_LOCATIONS' && location) {
        if (!locationAvailability?.isAvailable) {
          return null;
        }
      }

      return {
        id: vehicle.id,
        name: vehicle.name,
        slug: vehicle.slug,
        brand: vehicle.brand,
        category: vehicle.fleet_categories?.name,
        categorySlug: vehicle.fleet_categories?.slug,
        vehicleType: vehicle.vehicleType,
        price: locationRate?.dailyRate || vehicle.basePrice,
        basePrice: vehicle.basePrice,
        weeklyRate: locationRate?.weeklyRate,
        monthlyRate: locationRate?.monthlyRate,
        kmLimit: locationRate?.kmLimit || 100,
        extraKmRate: locationRate?.extraKmRate || 10,
        securityDeposit: locationRate?.securityDeposit || 5000,
        description: vehicle.description,
        shortDesc: vehicle.shortDesc,
        specs: vehicle.specs ? (
          typeof vehicle.specs === 'string' && (vehicle.specs.startsWith('[') || vehicle.specs.startsWith('{'))
            ? JSON.parse(vehicle.specs)
            : vehicle.specs
        ) : null,
        features: vehicle.features ? (
          typeof vehicle.features === 'string' && (vehicle.features.startsWith('[') || vehicle.features.startsWith('{'))
            ? JSON.parse(vehicle.features)
            : []
        ) : [],
        primaryImage: vehicle.primaryImage,
        images: vehicle.images ? (
          typeof vehicle.images === 'string' && (vehicle.images.startsWith('[') || vehicle.images.startsWith('{'))
            ? JSON.parse(vehicle.images)
            : []
        ) : [],
        isFeatured: vehicle.isFeatured,
        priority: vehicle.priority,
      };
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      vehicles: result,
      total: result.length,
    });
  } catch (error) {
    logger.error('Customer luxury fleet API error', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch luxury fleet' },
      { status: 500 }
    );
  }
}
