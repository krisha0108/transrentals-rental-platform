// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate a unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// GET - Get vendor's fleet with all necessary data for the fleet page
export async function GET(request: NextRequest) {
  try {
    // 1. Verify session (supports both web and mobile)
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Not authenticated' },
        { status: 401 }
      );
    }

    const vendorId = auth.vendorId;

    // Fetch all data in parallel for better performance
    const [
      fleet,
      rawModels,
      approvedServiceRecords,
      approvedLocationRecords,
      tripTypes,
      localPackages,
      brands,
      vehicleCategories,
    ] = await Promise.all([
      // 1. Fleet data
      prisma.vendor_fleets.findMany({
        where: { vendorId },
        include: {
          vehicle_models: {
            include: {
              brands: true,
              chauffeur_vehicle_categories: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  seatingCapacity: true,
                  fuelType: true,
                  acType: true,
                  image: true,
                },
              },
            },
          },
          services: { select: { id: true, name: true, slug: true } },
          chauffeur_vehicle_categories: {
            select: {
              id: true, name: true, slug: true,
              seatingCapacity: true, luggageCapacity: true,
              acType: true, fuelType: true, image: true,
            },
          },
          brands: { select: { id: true, name: true, slug: true, logo: true } },
          vendor_fleet_locations: {
            include: {
              locations: { select: { id: true, name: true, slug: true, parentId: true } },
            },
          },
          fleet_pricing: {
            select: {
              id: true, tripTypeId: true, localPackageId: true, priceType: true,
              basePrice: true, perKmRate: true, perHourRate: true, perDayRate: true,
              driverAllowance: true, nightCharges: true,
              kmLimitPerDay: true, extraKmCharge: true, deposit: true,
              locationId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }).catch((e) => { logger.error('Error fetching fleet', e); return []; }),

      // 2. Vehicle models
      prisma.vehicle_models.findMany({
        where: { isActive: true },
        select: {
          id: true, name: true, slug: true, serviceId: true, subServiceId: true,
          vehicleCategoryId: true, sideImage: true, fuelType: true,
          transmission: true, seatingCapacity: true,
          brands: { select: { id: true, name: true, slug: true, logo: true } },
          services_vehicle_models_serviceIdToservices: { select: { id: true, slug: true, name: true, parentId: true } },
          chauffeur_vehicle_categories: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { name: 'asc' },
      }).catch((e) => { logger.error('Error fetching vehicle models', e); return []; }),

      // 3. Approved services
      prisma.vendor_approved_services.findMany({
        where: { vendorId, isActive: true },
        include: {
          services: {
            select: {
              id: true, name: true, slug: true, icon: true, isActive: true, parentId: true,
              other_services: { select: { id: true, name: true, slug: true }, where: { isActive: true } },
            },
          },
        },
      }).catch((e) => { logger.error('Error fetching approved services', e); return []; }),

      // 4. Approved locations
      prisma.vendor_approved_locations.findMany({
        where: { vendorId, isActive: true },
        include: {
          locations: { select: { id: true, name: true, slug: true, parentId: true } },
        },
      }).catch((e) => { logger.error('Error fetching approved locations', e); return []; }),

      // 5. Trip types
      prisma.trip_types.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, description: true, displayOrder: true },
        orderBy: { displayOrder: 'asc' },
      }).catch((e) => { logger.error('Error fetching trip types', e); return []; }),

      // 6. Local packages
      prisma.local_packages.findMany({
        where: { isActive: true },
        select: { id: true, name: true, hours: true, kms: true, displayOrder: true },
        orderBy: { displayOrder: 'asc' },
      }).catch((e) => { logger.error('Error fetching local packages', e); return []; }),

      // 7. Brands
      prisma.brands.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, logo: true, serviceId: true, vehicleCategoryId: true },
        orderBy: { displayOrder: 'asc' },
      }).catch((e) => { logger.error('Error fetching brands', e); return []; }),

      // 8. Vehicle categories
      prisma.chauffeur_vehicle_categories.findMany({
        where: { isActive: true },
        select: {
          id: true, name: true, slug: true, description: true,
          seatingCapacity: true, luggageCapacity: true, acType: true, fuelType: true,
          image: true, displayOrder: true, serviceId: true,
        },
        orderBy: { displayOrder: 'asc' },
      }).catch((e) => { logger.error('Error fetching vehicle categories', e); return []; }),
    ]);

    // Transform vehicle models - handle null brand gracefully and map service relation
    const vehicleModels = rawModels.map((model: any) => ({
      ...model,
      brand: model.brands || { id: '', name: 'Unknown Brand', slug: '', logo: null },
      service: model.services_vehicle_models_serviceIdToservices || null,
      vehicle_category: model.chauffeur_vehicle_categories || null,
    }));

    // Transform approved services
    const approvedServices = approvedServiceRecords
      .map((as: any) => as.services)
      .filter((s: any) => s && s.isActive);

    // Transform approved locations
    const approvedLocations = approvedLocationRecords
      .map((al: any) => al.locations)
      .filter((l: any) => l);

    // Transform fleet images and handle potential stringified nulls
    const transformedFleet = fleet.map((vehicle: any) => ({
      ...vehicle,
      images: vehicle.images
        ? (typeof vehicle.images === 'string'
          ? (vehicle.images === 'null' ? null : JSON.parse(vehicle.images))
          : vehicle.images)
        : null
    }));

    // Return all data
    return NextResponse.json({
      success: true,
      fleet: transformedFleet,
      vehicleModels,
      approvedServices,
      approvedLocations,
      tripTypes,
      localPackages,
      brands,
      vehicleCategories,
    });
  } catch (error: any) {
    logger.error('Vendor fleet API error', error);
    console.error('Error stack:', error?.stack);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch fleet data',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST - Add new vehicle to fleet
export async function POST(request: NextRequest) {
  try {
    // 1. Verify session (supports both web and mobile)
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Not authenticated' },
        { status: 401 }
      );
    }

    const vendorId = auth.vendorId;

    // 2. Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const {
      vehicleModelId,
      serviceId,
      subServiceId,
      vehicleCategoryId, // For car-rental
      brandId, // For car-rental
      registrationNumber,
      yearOfManufacture,
      color,
      images,
      locationIds,
      pricing,
    } = body;

    // 3. Validate required fields
    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'Service is required' },
        { status: 400 }
      );
    }

    // Get service details to check service type
    const service = await prisma.services.findUnique({
      where: { id: serviceId },
      select: { slug: true, name: true },
    });

    const serviceName = service?.name?.toLowerCase() || '';
    const serviceSlug = service?.slug?.toLowerCase() || '';

    // IMPORTANT: Check self-drive FIRST because slug might be "self-drive-car-rental"
    const isSelfDrive = serviceSlug.includes('self-drive') ||
      serviceName.includes('self-drive') ||
      serviceName.includes('self drive');

    const isBikeRental = serviceSlug.includes('bike') || serviceName.includes('bike');
    const isBusRental = serviceSlug.includes('bus') || serviceName.includes('bus');

    // Truck, Equipment, Packers - only need category (no model)
    const isTruckRental = serviceSlug.includes('truck') || serviceName.includes('truck') ||
      serviceName.includes('transporter') || serviceSlug.includes('transporter');
    const isEquipmentRental = serviceSlug.includes('equipment') || serviceName.includes('equipment') ||
      serviceName.includes('crane') || serviceName.includes('jcb');
    const isPackersMovers = serviceSlug.includes('packer') || serviceName.includes('packer') ||
      serviceSlug.includes('mover') || serviceName.includes('mover');

    // Luxury car rental - needs model selection (like bike/bus)
    const isLuxuryCarRental = serviceSlug.includes('luxury') || serviceName.includes('luxury');

    // Category-only services: truck, equipment, packers (no model selection)
    const isCategoryOnlyService = isTruckRental || isEquipmentRental || isPackersMovers;

    // Car rental (with driver) - only if NOT self-drive, NOT bike, and NOT luxury
    const isCarRental = !isSelfDrive && !isBikeRental && !isLuxuryCarRental && (
      serviceSlug === 'car-rental' || serviceName.includes('car rental')
    );

    // Validate required fields based on service type
    if (isCarRental) {
      // Car rental needs category + brand
      if (!vehicleCategoryId) {
        return NextResponse.json(
          { success: false, error: 'Vehicle category is required for car rental' },
          { status: 400 }
        );
      }
    } else if (isCategoryOnlyService) {
      // Truck, Equipment, Packers only need category
      if (!vehicleCategoryId) {
        return NextResponse.json(
          { success: false, error: 'Vehicle category is required' },
          { status: 400 }
        );
      }
    } else {
      // Bike rental, self-drive, bus, luxury need vehicle model
      if (!vehicleModelId) {
        return NextResponse.json(
          { success: false, error: `Vehicle model is required for ${isLuxuryCarRental ? 'luxury car rental' : isBikeRental ? 'bike rental' : isBusRental ? 'bus rental' : 'this service'}` },
          { status: 400 }
        );
      }
    }

    // 4. Verify service is approved for this vendor
    const approvedService = await prisma.vendor_approved_services.findFirst({
      where: {
        vendorId,
        serviceId,
        isActive: true,
      },
    });

    if (!approvedService) {
      return NextResponse.json(
        { success: false, error: 'You are not approved for this service' },
        { status: 403 }
      );
    }

    // 5. Verify vehicle model or vehicle category exists
    if (isCarRental || isCategoryOnlyService) {
      // Verify vehicle category exists (for car rental, truck, equipment, packers)
      const vehicle_category = await prisma.chauffeur_vehicle_categories.findUnique({
        where: { id: vehicleCategoryId },
      });

      if (!vehicle_category) {
        return NextResponse.json(
          { success: false, error: 'Vehicle category not found' },
          { status: 400 }
        );
      }

      // Verify brand exists if provided (only for car rental)
      if (isCarRental && brandId) {
        const brand = await prisma.brands.findUnique({
          where: { id: brandId },
        });

        if (!brand) {
          return NextResponse.json(
            { success: false, error: 'Brand not found' },
            { status: 400 }
          );
        }
      }
    } else {
      // Verify vehicle model exists (for bike, self-drive, bus)
      const vehicle_model = await prisma.vehicle_models.findUnique({
        where: { id: vehicleModelId },
      });

      if (!vehicle_model) {
        return NextResponse.json(
          { success: false, error: 'Vehicle model not found' },
          { status: 400 }
        );
      }
    }

    // 6. Verify locations are approved (if provided)
    let validLocationIds: string[] = [];
    if (locationIds && Array.isArray(locationIds) && locationIds.length > 0) {
      const approvedLocationRecords = await prisma.vendor_approved_locations.findMany({
        where: {
          vendorId,
          locationId: { in: locationIds },
          isActive: true,
        },
        select: { locationId: true },
      });

      validLocationIds = approvedLocationRecords.map((l) => l.locationId);

      const invalidLocations = locationIds.filter(
        (id: string) => !validLocationIds.includes(id)
      );

      if (invalidLocations.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Some locations are not approved: ${invalidLocations.join(', ')}`,
          },
          { status: 400 }
        );
      }
    }

    // 7. Process pricing data
    let processedPricing: any[] = [];
    if (pricing && Array.isArray(pricing) && pricing.length > 0) {
      for (const p of pricing) {
        let tripTypeId = p.tripTypeId;
        let resolvedTripTypeId: string | null = null;

        // If tripTypeId looks like a slug, resolve it
        if (tripTypeId && typeof tripTypeId === 'string') {
          // Check if it's not a CUID (CUIDs start with 'c' and are ~25 chars)
          const isCuid = tripTypeId.startsWith('c') && tripTypeId.length > 20;

          if (isCuid) {
            resolvedTripTypeId = tripTypeId;
          } else {
            // Try to find the trip type by slug/name
            const tripType = await prisma.trip_types.findFirst({
              where: {
                OR: [
                  { slug: tripTypeId },
                  { slug: tripTypeId.toLowerCase() },
                  { name: { contains: tripTypeId } },
                ],
              },
            });

            if (tripType) {
              resolvedTripTypeId = tripType.id;
            } else {
              // For self-drive and bike rental, find or create the appropriate trip type
              if (isSelfDrive) {
                console.log(`Trip type not found for: ${tripTypeId}, creating self-drive trip type`);
                const newTripType = await prisma.trip_types.upsert({
                  where: { slug: 'self-drive' },
                  create: {
                    id: generateId(),
                    name: 'Self Drive',
                    slug: 'self-drive',
                    description: 'Self-drive car rental - drive yourself',
                    isActive: true,
                    displayOrder: 10,
                  },
                  update: {},
                });
                resolvedTripTypeId = newTripType.id;
              } else if (isBikeRental) {
                console.log(`Trip type not found for: ${tripTypeId}, creating bike rental trip type`);
                const newTripType = await prisma.trip_types.upsert({
                  where: { slug: 'bike-rental' },
                  create: {
                    id: generateId(),
                    name: 'Bike Rental',
                    slug: 'bike-rental',
                    description: 'Bike rental - daily rental',
                    isActive: true,
                    displayOrder: 11,
                  },
                  update: {},
                });
                resolvedTripTypeId = newTripType.id;
              } else {
                console.log(`Trip type not found for: ${tripTypeId}, skipping`);
                continue;
              }
            }
          }
        }

        // Add pricing if we have a valid tripTypeId
        const priceType = p.pricingType || p.priceType || 'PER_DAY';

        if (resolvedTripTypeId) {
          processedPricing.push({
            locationId: p.locationId || null,
            tripTypeId: resolvedTripTypeId,
            localPackageId: p.localPackageId || null,
            priceType,
            basePrice: parseFloat(p.basePrice) || 0,
            perKmRate: p.perKmRate ? parseFloat(p.perKmRate) : null,
            perHourRate: p.perHourRate ? parseFloat(p.perHourRate) : null,
            perDayRate: p.perDayRate ? parseFloat(p.perDayRate) : null,
            driverAllowance: p.driverAllowance ? parseFloat(p.driverAllowance) : null,
            nightCharges: p.nightCharges ? parseFloat(p.nightCharges) : null,
            // Bike rental and self-drive specific fields
            kmLimitPerDay: p.kmLimit ? parseInt(p.kmLimit) : (p.kmLimitPerDay ? parseInt(p.kmLimitPerDay) : null),
            extraKmCharge: p.extraKmCharge ? parseFloat(p.extraKmCharge) : (p.perKmRate ? parseFloat(p.perKmRate) : null),
            deposit: p.deposit ? parseFloat(p.deposit) : null,
          });
        }
      }
    }

    // 8. Create fleet entry
    const fleetVehicle = await prisma.vendor_fleets.create({
      data: {
        id: generateId(),
        vendorId,
        vehicleModelId: vehicleModelId || null, // Optional for car-rental
        serviceId,
        subServiceId: subServiceId || null,
        vehicleCategoryId: vehicleCategoryId || null, // For car-rental
        brandId: brandId || null, // For car-rental
        registrationNumber: registrationNumber || null,
        yearOfManufacture: yearOfManufacture ? parseInt(yearOfManufacture) : null,
        color: color || null,
        images: Array.isArray(images) ? JSON.stringify(images) : (images || null),
        isActive: true,
        isAvailable: true,
        vendor_fleet_locations:
          validLocationIds.length > 0
            ? {
              create: validLocationIds.map((locationId) => ({
                id: generateId(),
                locationId,
              })),
            }
            : undefined,
        fleet_pricing:
          processedPricing.length > 0
            ? {
              create: processedPricing.map((p) => ({ ...p, id: generateId() })),
            }
            : undefined,
      },
      include: {
        vehicle_models: {
          include: {
            brands: true,
            chauffeur_vehicle_categories: {
              select: {
                id: true,
                name: true,
                slug: true,
                seatingCapacity: true,
                fuelType: true,
                acType: true,
                image: true,
              },
            },
          },
        },
        services: {
          select: { id: true, name: true, slug: true },
        },
        chauffeur_vehicle_categories: {
          select: { id: true, name: true, slug: true },
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
            locationId: true,
            tripTypeId: true,
            priceType: true,
            basePrice: true,
            perDayRate: true,
            perHourRate: true,
          },
        },
      },
    });

    // Transform the created vehicle images
    const transformedFleetVehicle = {
      ...fleetVehicle,
      images: fleetVehicle.images
        ? (typeof fleetVehicle.images === 'string'
          ? (fleetVehicle.images === 'null' ? null : JSON.parse(fleetVehicle.images))
          : fleetVehicle.images)
        : null
    };

    return NextResponse.json({
      success: true,
      fleet: transformedFleetVehicle,
      message: 'Vehicle added successfully',
    });
  } catch (error: any) {
    logger.error('Add fleet error', error);
    console.error('Error code:', error?.code);
    console.error('Error meta:', error?.meta);

    // Handle specific Prisma errors
    if (error?.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'A vehicle with these details already exists',
        },
        { status: 400 }
      );
    }

    if (error?.code === 'P2003') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid reference - check vehicle model, service, or location IDs',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to add vehicle",
        details: error?.message || "Unknown error",
        stack: error?.stack,
        code: error?.code,
        meta: error?.meta,
      },
      { status: 500 }
    );
  }
}
