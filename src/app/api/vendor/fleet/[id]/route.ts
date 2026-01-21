import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}
export const dynamic = 'force-dynamic';

// GET - Get single fleet vehicle
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const vehicle = await prisma.vendor_fleets.findFirst({
      where: { id, vendorId: auth.vendorId },
      include: {
        vehicle_models: {
          include: { brands: true },
        },
        services: {
          select: { id: true, name: true, slug: true },
        },
        // Car rental specific relations
        chauffeur_vehicle_categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            seatingCapacity: true,
            luggageCapacity: true,
            acType: true,
            fuelType: true,
            image: true,
          },
        },
        brands: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        vendor_fleet_locations: {
          include: {
            locations: {
              select: { id: true, name: true, slug: true, parentId: true },
            },
          },
        },
        fleet_pricing: {
          select: {
            id: true,
            tripTypeId: true,
            localPackageId: true,
            priceType: true,
            basePrice: true,
            perKmRate: true,
            perHourRate: true,
            perDayRate: true,
            driverAllowance: true,
            nightCharges: true,
            // Bike specific fields
            kmLimitPerDay: true,
            extraKmCharge: true,
            deposit: true,
            locations: {
              select: { id: true, name: true }
            }
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, vehicle });
  } catch (error: any) {
    logger.error('Get fleet vehicle error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vehicle', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Partial update fleet vehicle (for toggling active status, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.vendor_fleets.findFirst({
      where: { id, vendorId: auth.vendorId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const {
      registrationNumber,
      yearOfManufacture,
      color,
      images,
      isAvailable,
      isActive,
    } = body;

    // Build update data - only include fields that are provided
    const updateData: any = {};
    if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber;
    if (yearOfManufacture !== undefined) updateData.yearOfManufacture = yearOfManufacture;
    if (color !== undefined) updateData.color = color;
    if (images !== undefined) updateData.images = images;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.vendor_fleets.update({
      where: { id },
      data: updateData,
      include: {
        vehicle_models: {
          include: { brands: true },
        },
        services: {
          select: { id: true, name: true, slug: true },
        },
        chauffeur_vehicle_categories: {
          select: { id: true, name: true, slug: true, seatingCapacity: true, image: true },
        },
        brands: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        vendor_fleet_locations: {
          include: {
            locations: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        fleet_pricing: {
          select: {
            id: true,
            tripTypeId: true,
            priceType: true,
            basePrice: true,
            perDayRate: true,
            perHourRate: true,
            perKmRate: true,
            kmLimitPerDay: true,
            extraKmCharge: true,
            deposit: true,
            locations: {
              select: { id: true, name: true }
            }
          },
        },
      },
    });

    return NextResponse.json({ success: true, vehicle: updated });
  } catch (error: any) {
    logger.error('Patch fleet vehicle error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vehicle', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Full update fleet vehicle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.vendor_fleets.findFirst({
      where: { id, vendorId: auth.vendorId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    const {
      registrationNumber,
      yearOfManufacture,
      color,
      images,
      isAvailable,
      isActive,
      locationIds,
      pricing,
    } = body;

    // Update fleet vehicle
    const updated = await prisma.vendor_fleets.update({
      where: { id },
      data: {
        registrationNumber: registrationNumber ?? existing.registrationNumber,
        yearOfManufacture: yearOfManufacture ?? existing.yearOfManufacture,
        color: color ?? existing.color,
        images: images ?? existing.images,
        isAvailable: isAvailable ?? existing.isAvailable,
        isActive: isActive ?? existing.isActive,
      },
    });

    // Update locations if provided
    if (locationIds !== undefined && Array.isArray(locationIds)) {
      // Remove existing locations
      await prisma.vendor_fleet_locations.deleteMany({
        where: { vendorFleetId: id },
      });

      // Add new locations
      if (locationIds.length > 0) {
        await prisma.vendor_fleet_locations.createMany({
          data: locationIds.map((locationId: string) => ({
            id: generateId(),
            vendorFleetId: id,
            locationId,
          })),
        });
      }
    }

    // Update pricing if provided
    if (pricing !== undefined && Array.isArray(pricing)) {
      // Remove existing pricing
      await prisma.fleet_pricing.deleteMany({
        where: { vendorFleetId: id },
      });

      // Add new pricing
      if (pricing.length > 0) {
        for (const p of pricing) {
          let tripTypeId = p.tripTypeId;

          // Resolve trip type slug to ID if needed
          if (tripTypeId && typeof tripTypeId === 'string') {
            const isCuid = tripTypeId.startsWith('c') && tripTypeId.length > 20;
            if (!isCuid) {
              const tripType = await prisma.trip_types.findFirst({
                where: {
                  OR: [
                    { slug: tripTypeId },
                    { slug: tripTypeId.toLowerCase() },
                  ],
                },
              });
              if (tripType) {
                tripTypeId = tripType.id;
              } else {
                // Skip this pricing entry if trip type not found
                continue;
              }
            }
          }

          if (tripTypeId) {
            await prisma.fleet_pricing.create({
              data: {
                id: generateId(),
                vendorFleetId: id,
                tripTypeId,
                localPackageId: p.localPackageId || null,
                priceType: p.pricingType || p.priceType || 'PER_DAY',
                basePrice: parseFloat(p.basePrice) || 0,
                perKmRate: p.perKmRate ? parseFloat(p.perKmRate) : null,
                perHourRate: p.perHourRate ? parseFloat(p.perHourRate) : null,
                perDayRate: p.perDayRate ? parseFloat(p.perDayRate) : null,
                driverAllowance: p.driverAllowance ? parseFloat(p.driverAllowance) : null,
                nightCharges: p.nightCharges ? parseFloat(p.nightCharges) : null,
                // Bike specific fields
                kmLimitPerDay: p.kmLimit ? parseInt(p.kmLimit) : (p.kmLimitPerDay ? parseInt(p.kmLimitPerDay) : null),
                extraKmCharge: p.extraKmCharge ? parseFloat(p.extraKmCharge) : (p.perKmRate ? parseFloat(p.perKmRate) : null),
                deposit: p.deposit ? parseFloat(p.deposit) : null,
              },
            });
          }
        }
      }
    }

    // Fetch the updated vehicle with all relations
    const finalVehicle = await prisma.vendor_fleets.findUnique({
      where: { id },
      include: {
        vehicle_models: {
          include: { brands: true },
        },
        services: {
          select: { id: true, name: true, slug: true },
        },
        chauffeur_vehicle_categories: {
          select: { id: true, name: true, slug: true, seatingCapacity: true, image: true },
        },
        brands: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        vendor_fleet_locations: {
          include: {
            locations: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        fleet_pricing: {
          select: {
            id: true,
            tripTypeId: true,
            priceType: true,
            basePrice: true,
            perDayRate: true,
            perHourRate: true,
            perKmRate: true,
            kmLimitPerDay: true,
            extraKmCharge: true,
            deposit: true,
            locations: {
              select: { id: true, name: true }
            }
          },
        },
      },
    });

    return NextResponse.json({ success: true, vehicle: finalVehicle });
  } catch (error: any) {
    logger.error('Update fleet vehicle error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update vehicle', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove vehicle from fleet
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.vendor_fleets.findFirst({
      where: { id, vendorId: auth.vendorId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // Delete related records first (cascade should handle, but being explicit)
    await prisma.vendor_fleet_locations.deleteMany({
      where: { vendorFleetId: id },
    });

    await prisma.fleet_pricing.deleteMany({
      where: { vendorFleetId: id },
    });

    await prisma.vendor_fleets.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error: any) {
    logger.error('Delete fleet vehicle error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete vehicle', details: error?.message },
      { status: 500 }
    );
  }
}
