// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { LUXURY_LOCAL_PACKAGES, LUXURY_CAR_CATEGORIES } from '@/lib/luxury-pricing';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Fetch available vendor rates for local luxury bookings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationSlug = searchParams.get('location');
    const locationId = searchParams.get('locationId');
    const carCategory = searchParams.get('carCategory');
    const packageType = searchParams.get('package');

    // Get location
    let location;
    if (locationId) {
      location = await prisma.locations.findUnique({
        where: { id: locationId },
        select: { id: true, name: true, slug: true },
      });
    } else if (locationSlug) {
      location = await prisma.locations.findFirst({
        where: { slug: locationSlug, type: 'CITY', isActive: true },
        select: { id: true, name: true, slug: true },
      });
    }

    if (!location) {
      // Return default pricing from luxury-pricing.ts if no location found
      return NextResponse.json({
        success: true,
        hasVendorRates: false,
        rates: [],
        defaultPricing: LUXURY_CAR_CATEGORIES.map(c => ({
          carCategory: c.id,
          categoryName: c.name,
          examples: c.examples,
          packages: LUXURY_LOCAL_PACKAGES.map(p => ({
            packageType: p.id,
            packageLabel: p.label,
            packageHours: p.hours,
            packageKm: p.km,
            basePrice: c.pricing.local.base,
            extraKmRate: c.pricing.local.perKm,
            extraHourRate: c.pricing.local.perHr,
          })),
        })),
        carCategories: LUXURY_CAR_CATEGORIES.map(c => ({
          id: c.id,
          name: c.name,
          examples: c.examples,
          seats: c.seats,
          bags: c.bags,
          features: c.features,
        })),
        packageTypes: LUXURY_LOCAL_PACKAGES.map(p => ({
          id: p.id,
          label: p.label,
          hours: p.hours,
          km: p.km,
        })),
      });
    }

    // Build query for vendor rates
    const whereClause: any = {
      locationId: location.id,
      isActive: true,
    };

    if (carCategory) {
      whereClause.carCategory = carCategory;
    }

    if (packageType) {
      whereClause.packageType = packageType;
    }

    // Fetch vendor rates with vendor info
    const vendorRates = await prisma.luxury_vendor_rates.findMany({
      where: whereClause,
      include: {
        vendors: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            city: true,
            // Get vendor rating from completed bookings
          },
        },
        locations: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [
        { carCategory: 'asc' },
        { basePrice: 'asc' },
      ],
    });

    // Group rates by car category and package for better presentation
    const groupedByCategory: Record<string, {
      carCategory: string;
      categoryName: string;
      examples: string;
      rates: any[];
    }> = {};

    vendorRates.forEach((rate) => {
      const category = LUXURY_CAR_CATEGORIES.find(c => c.id === rate.carCategory);
      if (!groupedByCategory[rate.carCategory]) {
        groupedByCategory[rate.carCategory] = {
          carCategory: rate.carCategory,
          categoryName: category?.name || rate.carCategory,
          examples: category?.examples || '',
          rates: [],
        };
      }

      groupedByCategory[rate.carCategory].rates.push({
        id: rate.id,
        vendorId: rate.vendor.id,
        vendorName: rate.vendor.businessName,
        vendorLogo: rate.vendor.logo,
        packageType: rate.packageType,
        packageLabel: LUXURY_LOCAL_PACKAGES.find(p => p.id === rate.packageType)?.label || rate.packageType,
        packageHours: rate.packageHours,
        packageKm: rate.packageKm,
        basePrice: rate.basePrice,
        extraKmRate: rate.extraKmRate,
        extraHourRate: rate.extraHourRate,
        vehicleName: rate.vehicleName,
        vehicleYear: rate.vehicleYear,
        vehicleColor: rate.vehicleColor,
        vehicleImages: rate.vehicleImages,
      });
    });

    // Get the lowest price per category for display
    const categorySummary = Object.values(groupedByCategory).map(group => ({
      ...group,
      lowestPrice: Math.min(...group.rates.map(r => r.basePrice)),
      vendorCount: new Set(group.rates.map(r => r.vendorId)).size,
    }));

    // Also include default pricing for categories without vendor rates
    const vendorCategoryIds = new Set(Object.keys(groupedByCategory));
    const defaultPricing = LUXURY_CAR_CATEGORIES
      .filter(c => !vendorCategoryIds.has(c.id))
      .map(c => ({
        carCategory: c.id,
        categoryName: c.name,
        examples: c.examples,
        packages: LUXURY_LOCAL_PACKAGES.map(p => ({
          packageType: p.id,
          packageLabel: p.label,
          packageHours: p.hours,
          packageKm: p.km,
          basePrice: c.pricing.local.base,
          extraKmRate: c.pricing.local.perKm,
          extraHourRate: c.pricing.local.perHr,
        })),
        isDefault: true,
      }));

    return NextResponse.json({
      success: true,
      hasVendorRates: vendorRates.length > 0,
      location,
      rates: categorySummary,
      defaultPricing,
      carCategories: LUXURY_CAR_CATEGORIES.map(c => ({
        id: c.id,
        name: c.name,
        examples: c.examples,
        seats: c.seats,
        bags: c.bags,
        features: c.features,
      })),
      packageTypes: LUXURY_LOCAL_PACKAGES.map(p => ({
        id: p.id,
        label: p.label,
        hours: p.hours,
        km: p.km,
      })),
    });
  } catch (error: any) {
    logger.error('Failed to fetch luxury rates', error);
    return NextResponse.json(
      { error: 'Failed to fetch rates', details: error?.message },
      { status: 500 }
    );
  }
}
