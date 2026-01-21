// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { LUXURY_LOCAL_PACKAGES, LUXURY_CAR_CATEGORIES } from '@/lib/luxury-pricing';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get vendor's luxury local rates
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);

    if (!auth.authenticated || !auth.vendorId) {

      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    }

    const vendorId = auth.vendorId;


    // Get vendor

    const vendor = await prisma.vendors.findFirst({

      where: { id: vendorId },
      select: { id: true, city: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const carCategory = searchParams.get('carCategory');

    const whereClause: any = { vendorId: vendorId };
    if (locationId) whereClause.locationId = locationId;
    if (carCategory) whereClause.carCategory = carCategory;

    const rates = await prisma.luxury_vendor_rates.findMany({
      where: whereClause,
      include: {
        locations: { select: { id: true, name: true, slug: true } },
      },
      orderBy: [
        { carCategory: 'asc' },
        { packageHours: 'asc' },
      ],
    });

    // Also get available locations for the vendor
    const locations = await prisma.locations.findMany({
      where: {
        type: 'CITY',
        isActive: true,
      },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      rates,
      locations,
      carCategories: LUXURY_CAR_CATEGORIES.map(c => ({
        id: c.id,
        name: c.name,
        examples: c.examples,
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
    return NextResponse.json({ error: 'Failed to fetch rates', details: error?.message }, { status: 500 });
  }
}

// POST - Create a new luxury local rate
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);

    if (!auth.authenticated || !auth.vendorId) {

      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    }

    const vendorId = auth.vendorId;

    const body = await request.json();
    const {
      locationId,
      carCategory,
      packageType,
      basePrice,
      extraKmRate,
      extraHourRate,
      vehicleName,
      vehicleNumber,
      vehicleYear,
      vehicleColor,
      vehicleImages,
      minBookingHours,
    } = body;

    // Validate required fields
    if (!locationId || !carCategory || !packageType || !basePrice) {
      return NextResponse.json(
        { error: 'Location, car category, package type, and base price are required' },
        { status: 400 }
      );
    }

    // Validate car category
    const validCategory = LUXURY_CAR_CATEGORIES.find(c => c.id === carCategory);
    if (!validCategory) {
      return NextResponse.json({ error: 'Invalid car category' }, { status: 400 });
    }

    // Validate package type
    const validPackage = LUXURY_LOCAL_PACKAGES.find(p => p.id === packageType);
    if (!validPackage) {
      return NextResponse.json({ error: 'Invalid package type' }, { status: 400 });
    }

    // Check if rate already exists
    const existingRate = await prisma.luxury_vendor_rates.findFirst({
      where: {
        vendorId: vendorId,
        locationId,
        carCategory,
        packageType,
      },
    });

    if (existingRate) {
      return NextResponse.json(
        { error: 'Rate already exists for this combination. Use PATCH to update.' },
        { status: 400 }
      );
    }

    // Create the rate
    const rate = await prisma.luxury_vendor_rates.create({
      data: {
        vendorId: vendorId,
        locationId,
        carCategory,
        packageType,
        packageHours: validPackage.hours,
        packageKm: validPackage.km,
        basePrice: parseFloat(basePrice),
        extraKmRate: parseFloat(extraKmRate) || 0,
        extraHourRate: parseFloat(extraHourRate) || 0,
        vehicleName: vehicleName || null,
        vehicleNumber: vehicleNumber || null,
        vehicleYear: vehicleYear ? parseInt(vehicleYear) : null,
        vehicleColor: vehicleColor || null,
        vehicleImages: vehicleImages || null,
        minBookingHours: minBookingHours ? parseInt(minBookingHours) : 0,
        isActive: true,
      },
      include: {
        locations: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Rate created successfully',
      rate,
    });
  } catch (error: any) {
    logger.error('Failed to create luxury rate', error);
    return NextResponse.json({ error: 'Failed to create rate', details: error?.message }, { status: 500 });
  }
}

// PATCH - Update an existing rate
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);

    if (!auth.authenticated || !auth.vendorId) {

      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    }

    const vendorId = auth.vendorId;

    const body = await request.json();
    const {
      id,
      basePrice,
      extraKmRate,
      extraHourRate,
      vehicleName,
      vehicleNumber,
      vehicleYear,
      vehicleColor,
      vehicleImages,
      minBookingHours,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Rate ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existingRate = await prisma.luxury_vendor_rates.findFirst({
      where: { id, vendorId: vendorId },
    });

    if (!existingRate) {
      return NextResponse.json({ error: 'Rate not found or unauthorized' }, { status: 404 });
    }

    const rate = await prisma.luxury_vendor_rates.update({
      where: { id },
      data: {
        ...(basePrice !== undefined && { basePrice: parseFloat(basePrice) }),
        ...(extraKmRate !== undefined && { extraKmRate: parseFloat(extraKmRate) }),
        ...(extraHourRate !== undefined && { extraHourRate: parseFloat(extraHourRate) }),
        ...(vehicleName !== undefined && { vehicleName }),
        ...(vehicleNumber !== undefined && { vehicleNumber }),
        ...(vehicleYear !== undefined && { vehicleYear: vehicleYear ? parseInt(vehicleYear) : null }),
        ...(vehicleColor !== undefined && { vehicleColor }),
        ...(vehicleImages !== undefined && { vehicleImages }),
        ...(minBookingHours !== undefined && { minBookingHours: parseInt(minBookingHours) || 0 }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        locations: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Rate updated successfully',
      rate,
    });
  } catch (error: any) {
    logger.error('Failed to update luxury rate', error);
    return NextResponse.json({ error: 'Failed to update rate', details: error?.message }, { status: 500 });
  }
}

// DELETE - Delete a rate
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);

    if (!auth.authenticated || !auth.vendorId) {

      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    }

    const vendorId = auth.vendorId;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Rate ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existingRate = await prisma.luxury_vendor_rates.findFirst({
      where: { id, vendorId: vendorId },
    });

    if (!existingRate) {
      return NextResponse.json({ error: 'Rate not found or unauthorized' }, { status: 404 });
    }

    await prisma.luxury_vendor_rates.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Rate deleted successfully',
    });
  } catch (error: any) {
    logger.error('Failed to delete luxury rate', error);
    return NextResponse.json({ error: 'Failed to delete rate', details: error?.message }, { status: 500 });
  }
}
