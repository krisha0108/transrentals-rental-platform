import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
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

    // Get all states with their child cities AND villages.
    // Also fetch villages nested under cities (2 levels deep) so a village added under
    // a city still shows up as a service location under its state.
    const states = await prisma.locations.findMany({
      where: {
        type: 'STATE',
        isActive: true,
      },
      include: { other_locations: {
          where: {
            type: { in: ['CITY', 'VILLAGE'] },
            isActive: true,
          },
          include: {
            other_locations: {
              where: { type: 'VILLAGE', isActive: true },
              orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
            },
          },
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    // Get union territories along with any villages directly under them.
    const unionTerritories = await prisma.locations.findMany({
      where: {
        type: 'UNION_TERRITORY',
        isActive: true,
      },
      include: {
        other_locations: {
          where: { type: 'VILLAGE', isActive: true },
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    // Flatten state's children (cities + villages, plus villages-under-cities) into a single
    // list of places that can be toggled as service locations. Each entry tags `placeType`
    // and, for villages, the parent city name (if any) for UI clarity.
    const cities = states.flatMap((state) =>
      state.other_locations.flatMap((directChild: any) => {
        const directEntry = {
          ...directChild,
          placeType: directChild.type,
          parentName: null as string | null,
          locations: { name: state.name, code: state.code },
        };
        const nestedVillages = (directChild.type === 'CITY' && Array.isArray(directChild.other_locations))
          ? directChild.other_locations.map((v: any) => ({
              ...v,
              placeType: 'VILLAGE',
              parentName: directChild.name,
              locations: { name: state.name, code: state.code },
            }))
          : [];
        return [directEntry, ...nestedVillages];
      })
    );

    // Build UT entries: each UT itself + any villages directly under it.
    const utEntries = unionTerritories.flatMap((ut: any) => {
      const utEntry = {
        ...ut,
        placeType: 'UNION_TERRITORY',
        parentName: null as string | null,
        locations: { name: 'Union Territory', code: null },
      };
      const utVillages = (Array.isArray(ut.other_locations) ? ut.other_locations : []).map((v: any) => ({
        ...v,
        placeType: 'VILLAGE',
        parentName: ut.name,
        locations: { name: ut.name, code: ut.code },
      }));
      return [utEntry, ...utVillages];
    });

    // Add UT entries to the flat locations list
    const allLocations = [...cities, ...utEntries];

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
    const locations = allLocations.map((loc: any) => {
      const stats = locationStats[loc.id] || { vehicleCount: 0, vendorIds: new Set() };
      return {
        id: loc.id,
        name: loc.name,
        slug: loc.slug,
        type: loc.placeType || loc.type,
        parentName: loc.parentName || null,
        state: loc.locations?.name || '',
        stateCode: loc.locations?.code || '',
        tier: getTierFromState(loc.locations?.name || ''),
        isEnabled: enabledIds.includes(loc.id),
        vehicleCount: stats.vehicleCount,
        vendorCount: stats.vendorIds.size,
        isActive: loc.isActive,
      };
    });

    // Build union territories list — each UT entry plus any villages directly under it.
    const unionTerritoriesList = unionTerritories.flatMap((ut: any) => {
      const utStats = locationStats[ut.id] || { vehicleCount: 0, vendorIds: new Set() };
      const utEntry = {
        id: ut.id,
        name: ut.name,
        slug: ut.slug,
        code: ut.code,
        type: 'UNION_TERRITORY' as const,
        parentName: null as string | null,
        isEnabled: enabledIds.includes(ut.id),
        vehicleCount: utStats.vehicleCount,
        vendorCount: utStats.vendorIds.size,
      };
      const villages = (Array.isArray(ut.other_locations) ? ut.other_locations : []).map((v: any) => {
        const stats = locationStats[v.id] || { vehicleCount: 0, vendorIds: new Set() };
        return {
          id: v.id,
          name: v.name,
          slug: v.slug,
          code: v.code,
          type: 'VILLAGE' as const,
          parentName: ut.name,
          isEnabled: enabledIds.includes(v.id),
          vehicleCount: stats.vehicleCount,
          vendorCount: stats.vendorIds.size,
        };
      });
      return [utEntry, ...villages];
    });

    // Build hierarchical structure (State → Cities + Villages, plus villages under cities)
    const locationHierarchy = states.map((state: any) => {
      const statePlaces = state.other_locations.flatMap((directChild: any) => {
        const directStats = locationStats[directChild.id] || { vehicleCount: 0, vendorIds: new Set() };
        const directEntry = {
          id: directChild.id,
          name: directChild.name,
          slug: directChild.slug,
          type: directChild.type as 'CITY' | 'VILLAGE',
          parentName: null as string | null,
          isEnabled: enabledIds.includes(directChild.id),
          vehicleCount: directStats.vehicleCount,
          vendorCount: directStats.vendorIds.size,
        };
        const nestedVillages = (directChild.type === 'CITY' && Array.isArray(directChild.other_locations))
          ? directChild.other_locations.map((v: any) => {
              const vStats = locationStats[v.id] || { vehicleCount: 0, vendorIds: new Set() };
              return {
                id: v.id,
                name: v.name,
                slug: v.slug,
                type: 'VILLAGE' as const,
                parentName: directChild.name,
                isEnabled: enabledIds.includes(v.id),
                vehicleCount: vStats.vehicleCount,
                vendorCount: vStats.vendorIds.size,
              };
            })
          : [];
        return [directEntry, ...nestedVillages];
      });

      return {
        id: state.id,
        name: state.name,
        slug: state.slug,
        code: state.code,
        cities: statePlaces,
        enabledCount: statePlaces.filter((c: any) => c.isEnabled).length,
        totalCount: statePlaces.length,
      };
    }).filter((state: any) => state.totalCount > 0); // Only include states with at least one place

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
      unionTerritories: unionTerritoriesList,
      enabledIds,
      stats: {
        totalLocations: locations.length,
        enabledLocations: enabledIds.length,
        totalStates: locationHierarchy.length,
        totalUnionTerritories: unionTerritoriesList.length,
        enabledUnionTerritories: unionTerritoriesList.filter(ut => ut.isEnabled).length,
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
        // Get ALL service_locations IDs to find the highest number
        // (can't use orderBy: id DESC because it's alphabetical, not numeric)
        const allSLIds = await tx.service_locations.findMany({
          where: { id: { startsWith: 'SL_' } },
          select: { id: true },
        });

        // Find the highest numeric ID
        const maxIdNumber = allSLIds.reduce((max, sl) => {
          const num = parseInt(sl.id.replace('SL_', ''));
          return num > max ? num : max;
        }, 0);

        let nextIdNumber = maxIdNumber + 1;

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

    // Bust the public /api/locations cache (used by the homepage's per-service
    // city autocompletes) so newly enabled/disabled cities take effect right away.
    revalidateTag('locations');

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
