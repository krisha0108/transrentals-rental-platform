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
        type: 'CITY',
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

    // Build filters for category and brand
    const categoryFilter = categorySlug
      ? { services_vehicle_models_subServiceIdToservices: { slug: categorySlug } }
      : {};

    const brandFilter = brandSlug
      ? { brands: { slug: brandSlug } }
      : {};

    // Get all vehicle models for bikes with their vendor fleets at this location
    const vehicleModels = await prisma.vehicle_models.findMany({
      where: {
        serviceId: bikeService.id,
        isActive: true,
        ...categoryFilter,
        ...brandFilter,
        // Has at least one vendor fleet at this location
        vendor_fleets: {
          some: {
            isActive: true,
            isAvailable: true,
            vendors: {
              status: 'APPROVED',
            },
            vendor_fleet_locations: {
              some: {
                locationId: locationData.id,
                isActive: true,
              },
            },
          },
        },
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
        services_vehicle_models_subServiceIdToservices: {
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
        vendor_fleets: {
          where: {
            isActive: true,
            isAvailable: true,
            vendors: {
              status: 'APPROVED',
            },
            vendor_fleet_locations: {
              some: {
                locationId: locationData.id,
                isActive: true,
              },
            },
          },
          select: {
            id: true,
            isVerified: true,
            vendors: {
              select: {
                id: true,
                businessName: true,
                rating: true,
              },
            },
            fleet_pricing: {
              select: {
                perDayRate: true,
                priceType: true,
                deposit: true,
              },
            },
          },
        },
      },
    });

    // Aggregate the data
    const aggregatedBikes: AggregatedBike[] = [];

    for (const model of vehicleModels) {
      const vendorPrices: VendorPrice[] = [];

      for (const fleet of model.vendor_fleets) {
        // Get the first available pricing (fleet pricing is per vendor fleet, not per location)
        const pricing = fleet.fleet_pricing[0];
        const dailyRate = pricing?.perDayRate || 0;

        if (dailyRate > 0) {
          vendorPrices.push({
            vendorId: fleet.vendors.id,
            vendorName: fleet.vendors.businessName || 'Unknown Vendor',
            vendorFleetId: fleet.id,
            dailyRate,
            deposit: pricing?.deposit || 0,
            isVerified: fleet.isVerified || false,
            rating: fleet.vendors.rating ?? undefined,
          });
        }
      }

      if (vendorPrices.length === 0) continue;

      // Get Admin's display price for this location (from VehicleModelLocation or basePricePerDay)
      const adminLocationPrice = (model as any).vehicle_model_locations?.[0]?.basePricePerDay;
      const adminModelPrice = (model as any).basePricePerDay || 0;
      const displayPrice = adminLocationPrice || adminModelPrice;

      // Sort by daily rate
      vendorPrices.sort((a, b) => a.dailyRate - b.dailyRate);

      aggregatedBikes.push({
        id: model.id,
        name: model.name,
        slug: model.slug,
        brandId: model.brands?.id || '',
        brandName: model.brands?.name || 'Unknown Brand',
        brandLogo: model.brands?.logo ?? undefined,
        categoryId: model.services_vehicle_models_subServiceIdToservices?.id,
        categoryName: model.services_vehicle_models_subServiceIdToservices?.name,
        sideImage: model.sideImage ?? undefined,
        fuelType: model.fuelType ?? undefined,
        transmission: model.transmission ?? undefined,
        engineCC: model.engineCC ?? undefined,
        mileage: model.mileage ?? undefined,
        features: parseJsonField<string[]>(model.features, []),
        specs: parseJsonField<Record<string, unknown>>(model.specs, {}),
        lowestPrice: displayPrice > 0 ? displayPrice : (vendorPrices.length > 0 ? vendorPrices[0].dailyRate : 0),
        highestPrice: displayPrice > 0 ? displayPrice : (vendorPrices.length > 0 ? vendorPrices[vendorPrices.length - 1].dailyRate : 0),
        vendorCount: vendorPrices.length,
        vendorPrices,
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
    const categories = await prisma.services.findMany({
      where: {
        parentId: bikeService.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    const brands = await prisma.brands.findMany({
      where: {
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
