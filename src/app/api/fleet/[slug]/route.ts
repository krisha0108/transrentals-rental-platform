import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Public API - Get single vehicle by slug with location-based pricing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location') || '';

    const vehicle = await prisma.fleet.findFirst({
      where: { slug: resolvedParams.slug, isActive: true },
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
              orderBy: { dailyRate: 'asc' },
            },
        fleet_availability: location
          ? {
              where: {
                fleet_locations: { slug: location },
              },
              include: { fleet_locations: true },
            }
          : {
              where: { isAvailable: true },
              include: { fleet_locations: true },
            },
      },
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    const locationRate = location ? vehicle.fleet_location_rates?.[0] : null;
    const locationAvailability = location ? vehicle.fleet_availability?.[0] : null;

    // For SPECIFIC_LOCATIONS type, check if available in this location
    if (vehicle.availabilityType === 'SPECIFIC_LOCATIONS' && location) {
      if (!locationAvailability?.isAvailable) {
        return NextResponse.json({ error: 'Vehicle not available in this location' }, { status: 404 });
      }
    }

    // Get all available locations for this vehicle
    const availableLocations = vehicle.availabilityType === 'ALL_INDIA'
      ? await prisma.fleet_locations.findMany({
          where: { isActive: true },
          select: { id: true, name: true, slug: true, state: true, tier: true },
          orderBy: [{ tier: 'asc' }, { name: 'asc' }],
        })
      : vehicle.fleet_availability
          .filter(a => a.isAvailable)
          .map(a => ({
            id: a.fleet_locations.id,
            name: a.fleet_locations.name,
            slug: a.fleet_locations.slug,
            state: a.fleet_locations.state,
            tier: a.fleet_locations.tier,
          }));

    const result = {
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
      seoKeywords: vehicle.seoKeywords,
      availabilityType: vehicle.availabilityType,
      isAvailable: vehicle.availabilityType === 'ALL_INDIA' || locationAvailability?.isAvailable || false,
      quantity: locationAvailability?.quantity || 0,
      isFeatured: vehicle.isFeatured,
      priority: vehicle.priority,
      // Include all rates if no specific location
      allRates: !location ? vehicle.fleet_location_rates.map(r => ({
        locationId: r.locationId,
        locationName: r.fleet_locations.name,
        locationSlug: r.fleet_locations.slug,
        dailyRate: r.dailyRate,
        weeklyRate: r.weeklyRate,
        monthlyRate: r.monthlyRate,
        kmLimit: r.kmLimit,
        extraKmRate: r.extraKmRate,
        securityDeposit: r.securityDeposit,
      })) : undefined,
      availableLocations,
    };

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Fleet API error', error);
    return NextResponse.json({ error: 'Failed to fetch vehicle' }, { status: 500 });
  }
}
