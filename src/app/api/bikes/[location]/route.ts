import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { SERVICE_IDS } from '@/lib/constants/booking-services';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

function parseJsonField<T>(value: unknown, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return defaultValue; }
  }
  return value as T;
}

interface VendorPrice {
  vendorId: string;
  vendorName: string;
  vendorFleetId: string;
  dailyRate: number;
  weeklyRate?: number;
  monthlyRate?: number;
  deposit: number;
  isVerified: boolean;
  rating?: number;
  totalBookings?: number;
}

interface AggregatedBike {
  id: string;
  name: string;
  slug: string;
  brandId: string;
  brandName: string;
  brandLogo?: string;
  categoryId?: string;
  categoryName?: string;
  sideImage?: string;
  fuelType?: string;
  transmission?: string;
  engineCC?: number;
  mileage?: string;
  features?: string[];
  specs?: Record<string, any>;
  lowestPrice: number;
  highestPrice: number;
  vendorCount: number;
  vendorPrices: VendorPrice[];
}

// GET - Get all bikes available at a location with aggregated vendor prices
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ location: string }> }
) {
  try {
    const { location } = await params;
    const { searchParams } = new URL(request.url);

    const categorySlug = searchParams.get('category');
    const brandSlug = searchParams.get('brand');
    const sortBy = searchParams.get('sort') || 'price_low';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    // Find the location - search by slug, id, or name
    const locationData = await prisma.locations.findFirst({
      where: {
        OR: [
          { slug: location },
          { slug: { startsWith: location } },
          { id: location },
          { name: location }, // Exact match
          { name: { contains: location } }, // Partial match
        ],
        isActive: true,
        type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] },
      },
    });

    if (!locationData) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Find the bike rental service by ID (not slug - slug can change)
    const bikeService = await prisma.services.findFirst({
      where: {
        id: SERVICE_IDS.BIKE_RENTAL,
        isActive: true,
      },
    });

    if (!bikeService) {
      return NextResponse.json(
        { error: 'Bike rental service not found' },
        { status: 404 }
      );
    }

    // Check if bike rental service is available in this location
    const serviceLocation = await prisma.service_locations.findFirst({
      where: {
        serviceId: bikeService.id,
        locationId: locationData.id,
        isActive: true,
      },
    });

    if (!serviceLocation) {
      return NextResponse.json(
        { error: 'Bike rental service not available in this location' },
        { status: 404 }
      );
    }

    // Get all vehicle models for bikes (admin models) - no dependency on vendor fleets
    const vehicleModels = await prisma.vehicle_models.findMany({
      where: {
        serviceId: bikeService.id,
        isActive: true,
        // Only show if brand is active
        brands: {
          isActive: true,
          ...(brandSlug ? { slug: brandSlug } : {}),
        },
        // Only show if vehicle category is active (if category exists)
        OR: [
          {
            chauffeur_vehicle_categories: {
              isActive: true,
              ...(categorySlug ? { slug: categorySlug } : {}),
            },
          },
          {
            vehicleCategoryId: null, // Allow bikes without category
          },
        ],
      },
      include: {
        brands: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        chauffeur_vehicle_categories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        vehicle_model_locations: {
          where: {
            locationId: locationData.id,
            isActive: true,
          },
          select: {
            basePricePerDay: true,
          }
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    console.log(`[Bikes API] Found ${vehicleModels.length} vehicle models for ${locationData.name}`);
    vehicleModels.forEach(model => {
      console.log(`  - ${model.name} (Brand: ${model.brands?.name}, Active: ${model.isActive}, Brand Active: ${model.brands?.isActive})`);
    });

    // Aggregate the data from admin vehicle models
    const aggregatedBikes: AggregatedBike[] = [];

    for (const model of vehicleModels) {
      // Check if this model is assigned to this location
      const hasLocationAssignment = model.vehicle_model_locations && model.vehicle_model_locations.length > 0;

      // Use admin's pricing from vehicle_model_locations (if exists) or vehicle_models table
      const locationSpecificPrice = model.vehicle_model_locations[0]?.basePricePerDay;
      const basePrice = locationSpecificPrice || model.basePricePerDay || 0;

      if (basePrice <= 0) {
        console.log(`[Bikes API] ❌ Skipping ${model.name} - no base price set (locationPrice: ${locationSpecificPrice}, modelPrice: ${model.basePricePerDay})`);
        continue;
      }
      console.log(`[Bikes API] ✅ Including ${model.name} - price: ${basePrice}`);

      // Count how many vendors have added this bike model at this location
      // Only count fleets that are EXPLICITLY assigned to this location
      const vendorFleetCount = await prisma.vendor_fleets.count({
        where: {
          vehicleModelId: model.id,
          isActive: true,
          isAvailable: true,
          vendors: {
            status: 'APPROVED', // Only count approved vendors
          },
          // Only show fleets explicitly assigned to this location
          vendor_fleet_locations: {
            some: {
              locationId: locationData.id,
              isActive: true,
            },
          },
        },
      });

      // Debug logging
      console.log(`[Bikes API] Model: ${model.name}, Location: ${locationData.name}, VendorFleetCount: ${vendorFleetCount}, HasLocationAssignment: ${hasLocationAssignment}, LocationPrice: ${locationSpecificPrice}, BasePrice: ${basePrice}`);

      // Skip this bike model if no vendor fleets are at this location
      // (hasLocationAssignment is still a fallback for admin-assigned models)
      if (vendorFleetCount === 0 && !hasLocationAssignment) {
        console.log(`[Bikes API] Skipping ${model.name} - no fleets or location assignment for this location`);
        continue;
      }

      // Display vendor count: Show at least 1 if we're displaying the bike
      // (If vendorFleetCount is 0 but locationSpecificPrice exists, show as 1)
      const displayVendorCount = Math.max(1, vendorFleetCount);

      // Only admin price is shown to customer (no vendor pricing)
      const adminVendorPrice: VendorPrice = {
        vendorId: 'admin',
        vendorName: 'TransRentals',
        vendorFleetId: model.id,
        dailyRate: basePrice,
        deposit: 0,
        isVerified: true,
      };

      aggregatedBikes.push({
        id: model.id,
        name: model.name,
        slug: model.slug,
        brandId: model.brands?.id || '',
        brandName: model.brands?.name || 'Unknown Brand',
        brandLogo: model.brands?.logo ?? undefined,
        categoryId: model.chauffeur_vehicle_categories?.id,
        categoryName: model.chauffeur_vehicle_categories?.name,
        sideImage: model.sideImage ?? undefined,
        fuelType: model.fuelType ?? undefined,
        transmission: model.transmission ?? undefined,
        engineCC: model.engineCC ?? undefined,
        mileage: model.mileage ?? undefined,
        features: parseJsonField<string[]>(model.features, []),
        specs: parseJsonField<Record<string, unknown>>(model.specs, {}),
        lowestPrice: basePrice, // Always admin's price
        highestPrice: basePrice, // Always admin's price
        vendorCount: displayVendorCount, // Minimum 1, or actual vendor count
        vendorPrices: [adminVendorPrice], // Only admin price shown
      });
    }

    // Apply price filters
    let filteredBikes = aggregatedBikes;

    if (minPrice) {
      const min = parseFloat(minPrice);
      filteredBikes = filteredBikes.filter((b) => b.lowestPrice >= min);
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      filteredBikes = filteredBikes.filter((b) => b.lowestPrice <= max);
    }

    // Sort
    switch (sortBy) {
      case 'price_high':
        filteredBikes.sort((a, b) => b.lowestPrice - a.lowestPrice);
        break;
      case 'vendors':
        filteredBikes.sort((a, b) => b.vendorCount - a.vendorCount);
        break;
      case 'name':
        filteredBikes.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price_low':
      default:
        filteredBikes.sort((a, b) => a.lowestPrice - b.lowestPrice);
        break;
    }

    // Get categories and brands for filters
    // Extract unique brand IDs from aggregated bikes (only show brands with bikes)
    const availableBrandIds = new Set(
      aggregatedBikes.map(b => b.brandId).filter(Boolean)
    );

    // Fetch all active bike categories (vehicle categories) for filtering
    const categories = await prisma.chauffeur_vehicle_categories.findMany({
      where: {
        serviceId: bikeService.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Fetch only brands that have bikes in this location
    const brands = await prisma.brands.findMany({
      where: {
        id: { in: Array.from(availableBrandIds) },
        serviceId: bikeService.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      location: {
        id: locationData.id,
        name: locationData.name,
        slug: locationData.slug,
      },
      bikes: filteredBikes,
      totalCount: filteredBikes.length,
      filters: {
        categories,
        brands,
        priceRange: {
          min: Math.min(...aggregatedBikes.map((b) => b.lowestPrice), 0),
          max: Math.max(...aggregatedBikes.map((b) => b.highestPrice), 0),
        },
      },
    });
  } catch (error: any) {
    logger.error('Aggregated bikes list error', error);
    return NextResponse.json(
      { error: 'Failed to fetch bikes', details: error?.message },
      { status: 500 }
    );
  }
}
