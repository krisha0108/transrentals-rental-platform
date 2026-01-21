import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CarFleetGridMultiVendor } from '@/components/car';
import { capitalize } from '@/lib/utils';
import { getCityBySlug } from '@/data/indian-cities';
import { prisma } from '@/lib/db/prisma';

function parseJsonField<T>(value: unknown, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return defaultValue; }
  }
  return value as T;
}

interface PageProps {
  params: {
    location: string;
  };
  searchParams: {
    pickupDate?: string;
    pickupTime?: string;
    dropDate?: string;
    dropTime?: string;
  };
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));
  const locationSlug = params.location;

  return {
    title: `Self-Drive Cars Available in ${locationName} | Compare Prices | TransRentals`,
    description: `Browse ${locationName}'s largest self-drive car rental collection. Compare prices from multiple vendors. Starting @₹999/day with instant booking.`,
    keywords: [
      `self drive car ${locationName}`,
      `car rental ${locationName}`,
      `rent car without driver ${locationName}`,
      `self drive rental ${locationName}`,
    ],
    openGraph: {
      title: `Available Self-Drive Cars in ${locationName} - Compare & Book | TransRentals`,
      description: `Browse and compare self-drive car rental prices in ${locationName}. Multiple vendors, best prices.`,
      type: 'website',
      url: `https://transrentals.in/self-drive-car-rentals/${locationSlug}/cars`,
    },
    alternates: {
      canonical: `https://transrentals.in/self-drive-car-rentals/${locationSlug}/cars`,
    },
  };
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

// Fetch location details
async function getLocationBySlug(locationSlug: string) {
  try {
    let location = await prisma.locations.findFirst({
      where: { slug: locationSlug },
      select: { id: true, name: true, slug: true },
    });

    if (!location) {
      location = await prisma.locations.findFirst({
        where: {
          name: { contains: locationSlug.replace(/-/g, ' ') },
          type: 'CITY',
        },
        select: { id: true, name: true, slug: true },
      });
    }

    return location;
  } catch (error) {
    console.error('Error fetching location:', error);
    return null;
  }
}

// Fetch self-drive cars with vendor fleet aggregation
async function getCarsForLocation(locationSlug: string): Promise<AggregatedCar[]> {
  try {
    // Find the location
    let location = await prisma.locations.findFirst({
      where: { slug: locationSlug },
    });

    if (!location) {
      location = await prisma.locations.findFirst({
        where: {
          name: { contains: locationSlug.replace(/-/g, ' ') },
          type: 'CITY',
        },
      });
    }

    if (!location) {
      console.log(`[getCarsForLocation] Location not found for slug: ${locationSlug}`);
      return [];
    }

    console.log(`[getCarsForLocation] Found location: ${location.name} (${location.id})`);

    // Find the self-drive car rental service
    const carService = await prisma.services.findFirst({
      where: {
        slug: { in: ['self-drive-car-rental', 'self-drive-car-rentals', 'self-drive'] },
        isActive: true,
        parentId: null,
      },
    });

    if (!carService) {
      console.log('[getCarsForLocation] Self-drive car service not found');
      return [];
    }

    console.log(`[getCarsForLocation] Service: ${carService.name} (${carService.id})`);

    // Get all vehicle models for self-drive cars with their vendor fleets at this location
    const vehicleModels = await prisma.vehicle_models.findMany({
      where: {
        serviceId: carService.id,
        isActive: true,
        // Must have at least one vendor fleet at this location
        vendor_fleets: {
          some: {
            isActive: true,
            isAvailable: true,
            OR: [
              {
                vendor_fleet_locations: {
                  some: {
                    locationId: location.id,
                    isActive: true,
                  },
                },
              },
              // Also include fleet with no location restrictions (available everywhere)
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
                    locationId: location.id,
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
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    console.log(`[getCarsForLocation] Found ${vehicleModels.length} vehicle models`);

    // Aggregate the data
    const aggregatedCars: AggregatedCar[] = [];

    for (const model of vehicleModels) {
      const vendorPrices: VendorPrice[] = [];

      for (const fleet of model.vendor_fleets) {
        const pricing = fleet.fleet_pricing[0];
        const dailyRate = pricing?.perDayRate || pricing?.basePrice || 0;

        if (dailyRate > 0) {
          vendorPrices.push({
            vendorId: fleet.vendors.id,
            vendorName: fleet.vendors.businessName || 'Unknown Vendor',
            vendorFleetId: fleet.id,
            dailyRate,
            kmLimitPerDay: pricing?.kmLimitPerDay || undefined,
            extraKmCharge: pricing?.extraKmCharge || undefined,
            deposit: pricing?.deposit || 0,
            isVerified: fleet.vendors.status === 'APPROVED',
          });
        }
      }

      // Sort by daily rate
      vendorPrices.sort((a, b) => a.dailyRate - b.dailyRate);

      if (vendorPrices.length === 0) continue;

      const prices = vendorPrices.map((v) => v.dailyRate);
      const lowestPrice = Math.min(...prices);
      const highestPrice = Math.max(...prices);

      // Determine car type from sub_service or name
      let carType = model.services_vehicle_models_subServiceIdToservices?.name || 'Sedan';
      const name = model.name.toLowerCase();
      if (name.includes('swift') || name.includes('i20') || name.includes('baleno') || name.includes('tiago') || name.includes('alto') || name.includes('wagonr')) {
        carType = 'Hatchback';
      } else if (name.includes('creta') || name.includes('seltos') || name.includes('xuv') || name.includes('harrier') || name.includes('safari') || name.includes('scorpio')) {
        carType = 'SUV';
      } else if (name.includes('venue') || name.includes('nexon') || name.includes('brezza') || name.includes('ecosport') || name.includes('sonet')) {
        carType = 'Compact SUV';
      } else if (name.includes('ertiga') || name.includes('innova') || name.includes('carens') || name.includes('xl6') || name.includes('marazzo')) {
        carType = 'MUV';
      } else if (name.includes('fortuner') || name.includes('camry') || name.includes('octavia') || name.includes('superb') || name.includes('mercedes') || name.includes('bmw') || name.includes('audi')) {
        carType = 'Luxury';
      }

      aggregatedCars.push({
        id: model.id,
        name: model.name,
        slug: model.slug,
        brandId: model.brands?.id || '',
        brandName: model.brands?.name || 'Unknown',
        brandLogo: model.brands?.logo || undefined,
        categoryId: model.services_vehicle_models_subServiceIdToservices?.id,
        categoryName: carType,
        sideImage: model.sideImage || undefined,
        fuelType: model.fuelType || undefined,
        transmission: model.transmission || undefined,
        engineCC: model.engineCC || undefined,
        mileage: model.mileage || undefined,
        seatingCapacity: model.seatingCapacity || 5,
        features: parseJsonField<string[]>(model.features, []),
        specs: parseJsonField<Record<string, unknown>>(model.specs, {}),
        lowestPrice,
        highestPrice,
        vendorCount: vendorPrices.length,
        vendorPrices,
      });
    }

    console.log(`[getCarsForLocation] Returning ${aggregatedCars.length} aggregated cars`);

    return aggregatedCars;
  } catch (error) {
    console.error('Error fetching cars:', error);
    return [];
  }
}

// Fetch brands for filters
async function getCarBrands() {
  try {
    const carService = await prisma.services.findFirst({
      where: {
        slug: { in: ['self-drive-car-rental', 'self-drive-car-rentals', 'self-drive'] },
        isActive: true,
        parentId: null,
      },
      select: { id: true },
    });

    const brands = await prisma.brands.findMany({
      where: {
        isActive: true,
        ...(carService ? { serviceId: carService.id } : {}),
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: { name: true },
    });

    return brands.map((b) => b.name);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
}

// Fetch categories for filters
async function getCarCategories() {
  try {
    const carService = await prisma.services.findFirst({
      where: {
        slug: { in: ['self-drive-car-rental', 'self-drive-car-rentals', 'self-drive'] },
        isActive: true,
        parentId: null,
      },
      select: { id: true },
    });

    if (!carService) return [];

    const categories = await prisma.services.findMany({
      where: {
        parentId: carService.id,
        isActive: true,
      },
      orderBy: { displayOrder: 'asc' },
      select: { name: true, slug: true },
    });

    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function CarsSearchPage({ params, searchParams }: PageProps) {
  // Validate search params
  if (!searchParams.pickupDate || !searchParams.pickupTime || !searchParams.dropDate || !searchParams.dropTime) {
    redirect(`/self-drive-car-rentals/${params.location}`);
  }

  const city = getCityBySlug(params.location);
  const locationName = city?.name || capitalize(params.location.replace(/-/g, ' '));

  // Fetch cars, brands, categories, and location in parallel
  const [cars, brands, categories, locationData] = await Promise.all([
    getCarsForLocation(params.location),
    getCarBrands(),
    getCarCategories(),
    getLocationBySlug(params.location),
  ]);

  return (
    <CarFleetGridMultiVendor
      vehicles={cars}
      city={locationName}
      citySlug={params.location}
      locationId={locationData?.id || ''}
      pickupDate={searchParams.pickupDate || ''}
      pickupTime={searchParams.pickupTime || ''}
      dropDate={searchParams.dropDate || ''}
      dropTime={searchParams.dropTime || ''}
      brands={brands}
      categories={categories}
    />
  );
}
