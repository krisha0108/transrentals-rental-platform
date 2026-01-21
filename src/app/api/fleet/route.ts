import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import logger from '@/lib/security/logger';

// Force dynamic rendering (API routes with query params should not be static)
export const dynamic = 'force-dynamic';
// Cache fleet data for 30 minutes
export const revalidate = 1800;

// Public API - Get fleet vehicles with location-based rates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') || '';
    const category = searchParams.get('category') || '';
    const type = searchParams.get('type') || '';
    const featured = searchParams.get('featured') === 'true';

    const where: any = { isActive: true };

    if (category) {
      where.fleet_categories = { slug: category };
    }

    if (type) {
      where.vehicleType = type;
    }

    if (featured) {
      where.isFeatured = true;
    }

    // Get vehicles with their rates for the specified location
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
          : false,
        fleet_availability: location
          ? {
              where: {
                fleet_locations: { slug: location },
              },
              include: { fleet_locations: true },
            }
          : false,
      },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });

    // Transform data to include location-specific pricing
    const result = vehicles.map((vehicle) => {
      const locationRate = (vehicle.fleet_location_rates as any)?.[0];
      const locationAvailability = (vehicle.fleet_availability as any)?.[0];

      // For SPECIFIC_LOCATIONS type, check if available in this location
      if (vehicle.availabilityType === 'SPECIFIC_LOCATIONS' && location) {
        if (!locationAvailability?.isAvailable) {
          return null; // Not available in this location
        }
      }

      return {
        id: vehicle.id,
        name: vehicle.name,
        slug: vehicle.slug,
        brand: vehicle.brand,
        category: vehicle.fleet_categories,
        vehicleType: vehicle.vehicleType,
        // Use location-specific rate or base price
        price: locationRate?.dailyRate || vehicle.basePrice,
        basePrice: vehicle.basePrice,
        weeklyRate: locationRate?.weeklyRate,
        monthlyRate: locationRate?.monthlyRate,
        kmLimit: locationRate?.kmLimit || 100,
        extraKmRate: locationRate?.extraKmRate || 5,
        securityDeposit: locationRate?.securityDeposit || 2000,
        description: vehicle.description,
        shortDesc: vehicle.shortDesc,
        specs: vehicle.specs,
        features: vehicle.features,
        primaryImage: vehicle.primaryImage,
        images: vehicle.images,
        availabilityType: vehicle.availabilityType,
        isAvailable: vehicle.availabilityType === 'ALL_INDIA' || locationAvailability?.isAvailable || false,
        quantity: locationAvailability?.quantity || 0,
        isFeatured: vehicle.isFeatured,
        priority: vehicle.priority,
      };
    }).filter(Boolean);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Fleet API error', error);
    return NextResponse.json({ error: 'Failed to fetch fleet' }, { status: 500 });
  }
}
