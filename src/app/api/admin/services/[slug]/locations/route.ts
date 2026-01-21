import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get locations for a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { slug } = resolvedParams;

    // Find the service by slug (may not exist yet)
    // Note: We only need locationId from service_locations, not the full location object
    // to avoid errors when locations have been deleted (orphaned references)
    const service = await prisma.services.findUnique({
      where: { slug },
      include: {
        service_locations: {
          select: {
            locationId: true,
            isActive: true,
          },
        },
      },
    });

    // Get all states with their child cities for hierarchical view
    const states = await prisma.locations.findMany({
      where: {
        type: 'STATE',
        isActive: true,
      },
      include: { other_locations: {
          where: {
            type: 'CITY',
            isActive: true,
          },
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    // Flatten cities for backward compatibility
    const cities = states.flatMap((state) =>
      state.other_locations.map((city) => ({
        ...city,
        locations: { name: state.name, code: state.code },
      }))
    );

    // Get enabled location IDs for this service (empty if service doesn't exist yet)
    const enabledIds = service
      ? service.service_locations.filter((sl) => sl.isActive).map((sl) => sl.locationId)
      : [];

    // Get vendor and vehicle counts per location (only if service exists)
    let locationStats: Record<string, { vehicleCount: number; vendorIds: Set<string> }> = {};

    if (service) {
      const vendorFleetLocations = await prisma.vendor_fleet_locations.findMany({
        where: {
          vendor_fleets: {
            serviceId: service.id,
            isActive: true,
          },
        },
        include: {
          vendor_fleets: {
            select: { vendorId: true },
          },
        },
      });

      // Count vehicles and vendors per location
      vendorFleetLocations.forEach((vfl) => {
        if (!locationStats[vfl.locationId]) {
          locationStats[vfl.locationId] = { vehicleCount: 0, vendorIds: new Set() };
        }
        locationStats[vfl.locationId].vehicleCount++;
        locationStats[vfl.locationId].vendorIds.add(vfl.vendor_fleets.vendorId);
      });
    }

    // Transform flat locations (for backward compatibility)
    const locations = cities.map((city) => {
      const stats = locationStats[city.id] || { vehicleCount: 0, vendorIds: new Set() };
      return {
        id: city.id,
        name: city.name,
        slug: city.slug,
        state: city.parent?.name || '',
        stateCode: city.parent?.code || '',
        tier: getTierFromState(city.parent?.name || ''),
        isEnabled: enabledIds.includes(city.id),
        vehicleCount: stats.vehicleCount,
        vendorCount: stats.vendorIds.size,
        isActive: city.isActive,
      };
    });

    // Build hierarchical structure (State → Cities)
    const locationHierarchy = states.map((state) => {
      const stateCities = state.other_locations.map((city) => {
        const stats = locationStats[city.id] || { vehicleCount: 0, vendorIds: new Set() };
        return {
          id: city.id,
          name: city.name,
          slug: city.slug,
          isEnabled: enabledIds.includes(city.id),
          vehicleCount: stats.vehicleCount,
          vendorCount: stats.vendorIds.size,
        };
      });

      return {
        id: state.id,
        name: state.name,
        slug: state.slug,
        code: state.code,
        cities: stateCities,
        enabledCount: stateCities.filter((c) => c.isEnabled).length,
        totalCount: stateCities.length,
      };
    }).filter((state) => state.totalCount > 0); // Only include states with cities

    return NextResponse.json({
      success: true,
      service: service
        ? {
            id: service.id,
            name: service.name,
            slug: service.slug,
          }
        : {
            id: null,
            name: slug, // Use slug as fallback name
            slug: slug,
          },
      locations,
      locationHierarchy,
      enabledIds,
      stats: {
        totalLocations: locations.length,
        enabledLocations: enabledIds.length,
        totalStates: locationHierarchy.length,
        tier1Count: locations.filter((l) => l.tier === 1).length,
        tier2Count: locations.filter((l) => l.tier === 2).length,
        tier3Count: locations.filter((l) => l.tier === 3).length,
      },
    });
  } catch (error: any) {
    logger.error('Service locations error', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Update service locations (enable/disable)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle both Promise and direct params (Next.js 14.2+ compatibility)
    const resolvedParams = 'then' in params ? await params : params;
    const { slug } = resolvedParams;
    const body = await request.json();
    const { locationIds } = body;

    if (!Array.isArray(locationIds)) {
      return NextResponse.json(
        { error: 'locationIds must be an array' },
        { status: 400 }
      );
    }

    // Find the service
    const service = await prisma.services.findUnique({
      where: { slug },
      include: {
        service_locations: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Get current enabled locations
    const currentIds = service.service_locations.map((sl) => sl.locationId);

    // Locations to add (in locationIds but not in current)
    const toAdd = locationIds.filter((id: string) => !currentIds.includes(id));

    // Locations to remove (in current but not in locationIds)
    const toRemove = currentIds.filter((id) => !locationIds.includes(id));

    // Perform updates in transaction
    await prisma.$transaction(async (tx) => {
      // Add new service locations
      if (toAdd.length > 0) {
        // Get the last service_locations ID to generate sequential IDs
        const lastSL = await tx.service_locations.findFirst({
          orderBy: { id: 'desc' },
          where: { id: { startsWith: 'SL_' } },
        });

        let nextIdNumber = lastSL
          ? parseInt(lastSL.id.replace('SL_', '')) + 1
          : 1;

        await tx.service_locations.createMany({
          data: toAdd.map((locationId: string) => ({
            id: `SL_${nextIdNumber++}`,
            serviceId: service.id,
            locationId,
            isActive: true,
          })),
          skipDuplicates: true,
        });
      }

      // Deactivate removed locations (soft delete)
      if (toRemove.length > 0) {
        await tx.service_locations.updateMany({
          where: {
            serviceId: service.id,
            locationId: { in: toRemove },
          },
          data: { isActive: false },
        });
      }

      // Re-activate existing locations that are now in the list
      await tx.service_locations.updateMany({
        where: {
          serviceId: service.id,
          locationId: { in: locationIds },
        },
        data: { isActive: true },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${locationIds.length} locations for ${service.name}`,
      added: toAdd.length,
      removed: toRemove.length,
    });
  } catch (error: any) {
    logger.error('Service locations update error', error);
    return NextResponse.json(
      { error: 'Failed to update locations', details: error?.message },
      { status: 500 }
    );
  }
}

// Helper function to determine tier based on state/city
function getTierFromState(state: string): number {
  const metroCities = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana', 'West Bengal', 'Gujarat'];
  const tier2States = ['Rajasthan', 'Punjab', 'Haryana', 'Kerala', 'Madhya Pradesh', 'Chandigarh', 'Goa'];

  if (metroCities.includes(state)) return 1;
  if (tier2States.includes(state)) return 2;
  return 3;
}
