import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

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
  kmLimitPerDay?: number;
  extraKmCharge?: number;
  deposit: number;
  isVerified: boolean;
  rating?: number;
  totalBookings?: number;
}

interface AggregatedCar {
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
  seatingCapacity?: number;
  features?: string[];
  specs?: Record<string, any>;
  lowestPrice: number;
  highestPrice: number;
  vendorCount: number;
  vendorPrices: VendorPrice[];
}

// GET - Get all self-drive cars available at a location with aggregated vendor prices
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

    // Find the location
    const locationData = await prisma.locations.findFirst({
      where: {
        OR: [
          { slug: location },
          { id: location },
        ],
        isActive: true,
      },
    });

    if (!locationData) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Find the self-drive car rental service
    const carService = await prisma.services.findFirst({
      where: {
        slug: { in: ['self-drive-car-rental', 'self-drive-car-rentals', 'self-drive'] },
        isActive: true,
        parentId: null,
      },
    });

    if (!carService) {
      return NextResponse.json(
        { error: 'Self-drive car rental service not found' },
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

    // Get all vehicle models for cars with their vendor fleets at this location
    const vehicleModels = await prisma.vehicle_models.findMany({
      where: {
        serviceId: carService.id,
        isActive: true,
        ...categoryFilter,
        ...brandFilter,
        // Has at least one vendor fleet at this location
        vendor_fleets: {
          some: {
            isActive: true,
            isAvailable: true,
            OR: [
              {
                vendor_fleet_locations: {
                  some: {
                    locationId: locationData.id,
                    isActive: true,
                  },
                },
              },
              // Also include fleet with no location restrictions
              {
                vendor_fleet_locations: {
                  none: {},
                },
              },
            ],
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
        vendor_fleets: {
          where: {
            isActive: true,
            isAvailable: true,
            OR: [
              {
                vendor_fleet_locations: {
                  some: {
                    locationId: locationData.id,
                    isActive: true,
                  },
                },
              },
              {
                vendor_fleet_locations: {
                  none: {},
                },
              },
            ],
          },
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                status: true,
              },
            },
            fleet_pricing: {
              where: {
                priceType: 'PER_DAY',
              },
              select: {
                basePrice: true,
                perDayRate: true,
                kmLimitPerDay: true,
                extraKmCharge: true,
                deposit: true,
              },
            },
          },
        },
      },
    });

    // Aggregate the data
    const aggregatedCars: AggregatedCar[] = vehicleModels
      .map((model) => {
        const vendorPricesRaw = model.vendor_fleets
          .map((fleet) => {
            // Get the daily rate from pricing
            const pricing = fleet.fleet_pricing[0];
            const dailyRate = pricing?.perDayRate || pricing?.basePrice || 0;

            if (dailyRate <= 0) return null;

            const price: VendorPrice = {
              vendorId: fleet.vendors.id,
              vendorName: fleet.vendors.businessName || 'Unknown Vendor',
              vendorFleetId: fleet.id,
              dailyRate,
              deposit: pricing?.deposit || 0,
              isVerified: fleet.vendors.status === 'APPROVED',
            };
            if (pricing?.kmLimitPerDay) price.kmLimitPerDay = pricing.kmLimitPerDay;
            if (pricing?.extraKmCharge) price.extraKmCharge = pricing.extraKmCharge;
            return price;
          });

        const vendorPrices = vendorPricesRaw
          .filter((v): v is VendorPrice => v !== null)
          .sort((a, b) => a.dailyRate - b.dailyRate);

        if (vendorPrices.length === 0) return null;

        const prices = vendorPrices.map((v) => v.dailyRate);
        const lowestPrice = Math.min(...prices);
        const highestPrice = Math.max(...prices);

        const car: AggregatedCar = {
          id: model.id,
          name: model.name,
          slug: model.slug,
          brandId: model.brands?.id || '',
          brandName: model.brands?.name || 'Unknown',
          lowestPrice,
          highestPrice,
          vendorCount: vendorPrices.length,
          vendorPrices,
        };
        if (model.brands?.logo) car.brandLogo = model.brands.logo;
        if (model.services_vehicle_models_subServiceIdToservices?.id) car.categoryId = model.services_vehicle_models_subServiceIdToservices.id;
        if (model.services_vehicle_models_subServiceIdToservices?.name) car.categoryName = model.services_vehicle_models_subServiceIdToservices.name;
        if (model.sideImage) car.sideImage = model.sideImage;
        if (model.fuelType) car.fuelType = model.fuelType;
        if (model.transmission) car.transmission = model.transmission;
        if (model.engineCC) car.engineCC = model.engineCC;
        if (model.mileage) car.mileage = model.mileage;
        if (model.seatingCapacity) car.seatingCapacity = model.seatingCapacity;
        if (model.features) car.features = parseJsonField<string[]>(model.features, []);
        if (model.specs) car.specs = parseJsonField<Record<string, unknown>>(model.specs, {});
        return car;
      })
      .filter((c): c is AggregatedCar => c !== null);

    // Apply price filters
    let filteredCars = aggregatedCars;

    if (minPrice) {
      const min = parseFloat(minPrice);
      filteredCars = filteredCars.filter((c) => c.lowestPrice >= min);
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      filteredCars = filteredCars.filter((c) => c.lowestPrice <= max);
    }

    // Sort
    switch (sortBy) {
      case 'price_high':
        filteredCars.sort((a, b) => b.lowestPrice - a.lowestPrice);
        break;
      case 'vendors':
        filteredCars.sort((a, b) => b.vendorCount - a.vendorCount);
        break;
      case 'name':
        filteredCars.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price_low':
      default:
        filteredCars.sort((a, b) => a.lowestPrice - b.lowestPrice);
        break;
    }

    // Get categories and brands for filters
    const categories = await prisma.services.findMany({
      where: {
        parentId: carService.id,
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
        serviceId: carService.id,
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
      cars: filteredCars,
      totalCount: filteredCars.length,
      filters: {
        categories,
        brands,
        priceRange: {
          min: Math.min(...aggregatedCars.map((c) => c.lowestPrice), 0),
          max: Math.max(...aggregatedCars.map((c) => c.highestPrice), 0),
        },
      },
    });
  } catch (error: any) {
    logger.error('Aggregated cars list error', error);
    return NextResponse.json(
      { error: 'Failed to fetch cars', details: error?.message },
      { status: 500 }
    );
  }
}
