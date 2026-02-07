import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';

// Generate unique ID
function generateId(prefix: string): string {
  return prefix + crypto.randomBytes(8).toString('hex');
}
export const dynamic = 'force-dynamic';

// GET - Get locations for a specific vehicle model or vendor fleet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> | { slug: string; id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { slug: serviceSlug, id: vehicleId } = resolvedParams;

    let vehicle: any = null;
    let assignedLocationIds: Set<string>;
    let isVendorFleet = false;

    // First try to find in vehicle_models
    vehicle = await prisma.vehicle_models.findUnique({
      where: { id: vehicleId },
      include: {
        vehicle_model_locations: {
          include: {
            locations: {
              select: { id: true, name: true, slug: true, type: true },
            },
          },
        },
      },
    });

    if (vehicle) {
      assignedLocationIds = new Set(vehicle.vehicle_model_locations.map((l: any) => l.locationId));
    } else {
      // If not found in vehicle_models, try vendor_fleets
      isVendorFleet = true;
      vehicle = await prisma.vendor_fleets.findUnique({
        where: { id: vehicleId },
        include: {
          vendor_fleet_locations: {
            include: {
              locations: {
                select: { id: true, name: true, slug: true, type: true },
              },
            },
          },
          vehicle_models: {
            select: { name: true },
          },
        },
      });

      if (!vehicle) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }

      assignedLocationIds = new Set(vehicle.vendor_fleet_locations.map((l: any) => l.locationId));
    }

    // Get service to filter locations
    const service = await prisma.services.findUnique({
      where: { slug: serviceSlug },
      select: { id: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Get locations that are configured for this service
    const serviceLocations = await prisma.service_locations.findMany({
      where: {
        serviceId: service.id,
        isActive: true,
      },
      select: {
        locationId: true,
      },
    });

    const serviceLocationIds = new Set(serviceLocations.map(sl => sl.locationId));

    // Get all locations with hierarchy (states, union territories and cities)
    // but only include cities that are configured for this service
    const states = await prisma.locations.findMany({
      where: { type: { in: ['STATE', 'UNION_TERRITORY'] }, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        other_locations: {
          where: {
            type: 'CITY',
            isActive: true,
            id: { in: Array.from(serviceLocationIds) }, // Only service-configured locations
          },
          select: { id: true, name: true, slug: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Build hierarchical structure (filter out states with no cities for this service)
    const locationHierarchy = states
      .filter(state => state.other_locations.length > 0)
      .map(state => ({
        id: state.id,
        name: state.name,
        slug: state.slug,
        type: 'state' as const,
        cities: state.other_locations.map(city => ({
          id: city.id,
          name: city.name,
          slug: city.slug,
          type: 'city' as const,
          isAssigned: assignedLocationIds.has(city.id),
        })),
        assignedCount: state.other_locations.filter(c => assignedLocationIds.has(c.id)).length,
        totalCount: state.other_locations.length,
      }));

    // Flat list of all cities for backward compatibility
    const allCities = states.flatMap(s => s.other_locations.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      stateName: s.name,
      isAssigned: assignedLocationIds.has(c.id),
    })));

    // Build assigned locations array (filter by service-specific locations only)
    const assignedLocations = isVendorFleet
      ? vehicle.vendor_fleet_locations
          .filter((l: any) => serviceLocationIds.has(l.locationId)) // Only service-configured locations
          .map((l: any) => ({
            id: l.id,
            locationId: l.locationId,
            locationName: l.locations.name,
            locationSlug: l.locations.slug,
            isActive: l.isActive,
          }))
      : vehicle.vehicle_model_locations
          .filter((l: any) => serviceLocationIds.has(l.locationId)) // Only service-configured locations
          .map((l: any) => ({
            id: l.id,
            locationId: l.locationId,
            locationName: l.locations.name,
            locationSlug: l.locations.slug,
            isActive: l.isActive,
            basePricePerDay: l.basePricePerDay,
          }));

    return NextResponse.json({
      success: true,
      vehicle: {
        id: vehicle.id,
        name: isVendorFleet ? (vehicle.vehicle_models?.name || vehicle.registrationNumber || vehicle.id) : vehicle.name,
      },
      assignedLocations,
      locationHierarchy,
      allLocations: allCities,
    });
  } catch (error: any) {
    logger.error('Vehicle locations error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle locations', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Assign locations to a vehicle model or vendor fleet
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> | { slug: string; id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id: vehicleId } = resolvedParams;

    const body = await request.json();
    const { locationIds, basePricePerDay } = body;

    if (!locationIds || !Array.isArray(locationIds)) {
      return NextResponse.json(
        { error: 'locationIds array is required' },
        { status: 400 }
      );
    }

    // First check if it's a vehicle model
    const vehicleModel = await prisma.vehicle_models.findUnique({
      where: { id: vehicleId },
    });

    if (vehicleModel) {
      // Create location assignments (upsert to handle duplicates)
      const results = await Promise.all(
        locationIds.map(async (locationId: string) => {
          return prisma.vehicle_model_locations.upsert({
            where: {
              vehicleModelId_locationId: {
                vehicleModelId: vehicleId,
                locationId,
              },
            },
            update: {
              isActive: true,
              basePricePerDay: basePricePerDay || null,
            },
            create: {
              id: generateId('VML_'),
              vehicleModelId: vehicleId,
              locationId,
              isActive: true,
              basePricePerDay: basePricePerDay || null,
            },
          });
        })
      );

      return NextResponse.json({
        success: true,
        message: `Assigned ${results.length} locations`,
        count: results.length,
      });
    }

    // If not a vehicle model, check vendor_fleets
    const vendorFleet = await prisma.vendor_fleets.findUnique({
      where: { id: vehicleId },
    });

    if (!vendorFleet) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    // Create location assignments (upsert to handle duplicates)
    const results = await Promise.all(
      locationIds.map(async (locationId: string) => {
        return prisma.vendor_fleet_locations.upsert({
          where: {
            vendorFleetId_locationId: {
              vendorFleetId: vehicleId,
              locationId,
            },
          },
          update: {
            isActive: true,
          },
          create: {
            id: generateId('VFL_'),
            vendorFleetId: vehicleId,
            locationId,
            isActive: true,
          },
        });
      })
    );

    return NextResponse.json({
      success: true,
      message: `Assigned ${results.length} locations`,
      count: results.length,
    });
  } catch (error: any) {
    logger.error('Assign locations error', error);
    return NextResponse.json(
      { error: 'Failed to assign locations', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove location assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> | { slug: string; id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id: vehicleId } = resolvedParams;

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');

    if (!locationId) {
      return NextResponse.json(
        { error: 'locationId is required' },
        { status: 400 }
      );
    }

    // First check if it's a vehicle model
    const vehicleModel = await prisma.vehicle_models.findUnique({
      where: { id: vehicleId },
    });

    if (vehicleModel) {
      await prisma.vehicle_model_locations.delete({
        where: {
          vehicleModelId_locationId: {
            vehicleModelId: vehicleId,
            locationId,
          },
        },
      });
    } else {
      // Try vendor_fleets
      await prisma.vendor_fleet_locations.delete({
        where: {
          vendorFleetId_locationId: {
            vendorFleetId: vehicleId,
            locationId,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Location removed',
    });
  } catch (error: any) {
    logger.error('Remove location error', error);
    return NextResponse.json(
      { error: 'Failed to remove location', details: error?.message },
      { status: 500 }
    );
  }
}
