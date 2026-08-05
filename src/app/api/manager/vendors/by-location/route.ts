import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { getCoreServiceCatalog } from '@/lib/services/vendor-service-status';

export const dynamic = 'force-dynamic';

// GET - Vendor counts per location, scoped to this manager's assigned locations only.
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: {
        manager_locations: { include: { locations: true } },
      },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);
    if (assignedLocationIds.length === 0) {
      return NextResponse.json({ success: true, locations: [], totalLinks: 0, activeLinks: 0 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const type = searchParams.get('type')?.trim() || '';
    const serviceKey = searchParams.get('service')?.trim() || '';

    let scopedLocationIds = assignedLocationIds;
    if (search || type) {
      const matches = await prisma.locations.findMany({
        where: {
          id: { in: assignedLocationIds },
          ...(search ? { name: { contains: search } } : {}),
          ...(type ? { type: type as any } : {}),
        },
        select: { id: true },
      });
      scopedLocationIds = matches.map((m) => m.id);
    }

    const approvedVendorFilter = { vendors: { status: 'APPROVED' as const } };
    const groupWhere = { ...approvedVendorFilter, locationId: { in: scopedLocationIds } };

    const [allCounts, activeCounts, totalLinks, activeLinks] = await Promise.all([
      prisma.vendor_approved_locations.groupBy({
        by: ['locationId'],
        where: groupWhere,
        _count: { id: true },
      }),
      prisma.vendor_approved_locations.groupBy({
        by: ['locationId'],
        where: { ...groupWhere, isActive: true },
        _count: { id: true },
      }),
      prisma.vendor_approved_locations.count({ where: groupWhere }),
      prisma.vendor_approved_locations.count({ where: { ...groupWhere, isActive: true } }),
    ]);

    const activeByLocation = new Map(activeCounts.map((c) => [c.locationId, c._count.id]));
    const locationMeta = new Map(manager.manager_locations.map((ml) => [ml.locationId, ml.locations]));

    // Service coverage per location — a location can show "N vendors" while
    // still having zero coverage for a given service, since location and
    // service approvals are independent grants.
    const coreServices = await getCoreServiceCatalog();
    const locationIds = allCounts.map((c) => c.locationId);
    const activeVendorLinks = await prisma.vendor_approved_locations.findMany({
      where: { locationId: { in: locationIds }, isActive: true, vendors: { status: 'APPROVED' } },
      select: { locationId: true, vendorId: true },
    });
    const vendorIdsAtLocations = [...new Set(activeVendorLinks.map((l) => l.vendorId))];
    const vendorServiceLinks = vendorIdsAtLocations.length
      ? await prisma.vendor_approved_services.findMany({
          where: { vendorId: { in: vendorIdsAtLocations }, isActive: true, serviceId: { in: coreServices.map((s) => s.id) } },
          select: { vendorId: true, serviceId: true },
        })
      : [];
    const servicesByVendor = new Map<string, Set<string>>();
    for (const link of vendorServiceLinks) {
      if (!servicesByVendor.has(link.vendorId)) servicesByVendor.set(link.vendorId, new Set());
      servicesByVendor.get(link.vendorId)!.add(link.serviceId);
    }
    const coveredServicesByLocation = new Map<string, Set<string>>();
    for (const link of activeVendorLinks) {
      if (!coveredServicesByLocation.has(link.locationId)) coveredServicesByLocation.set(link.locationId, new Set());
      const covered = coveredServicesByLocation.get(link.locationId)!;
      for (const serviceId of servicesByVendor.get(link.vendorId) || []) covered.add(serviceId);
    }

    // Optional single-service filter — narrows the list to only locations
    // where THAT service has an active vendor, and swaps the aggregate
    // "X/7" count for that service's actual vendor names, so a manager can
    // answer "which of my locations covers Bus Rental" without opening each
    // location one by one.
    const selectedService = serviceKey ? coreServices.find((s) => s.key === serviceKey) : null;
    let serviceVendorsByLocation: Map<string, { id: string; businessName: string }[]> | null = null;
    if (selectedService) {
      const vendorNames = await prisma.vendors.findMany({
        where: { id: { in: vendorIdsAtLocations } },
        select: { id: true, businessName: true },
      });
      const nameById = new Map(vendorNames.map((v) => [v.id, v.businessName]));
      serviceVendorsByLocation = new Map();
      for (const link of activeVendorLinks) {
        if (!servicesByVendor.get(link.vendorId)?.has(selectedService.id)) continue;
        if (!serviceVendorsByLocation.has(link.locationId)) serviceVendorsByLocation.set(link.locationId, []);
        serviceVendorsByLocation.get(link.locationId)!.push({ id: link.vendorId, businessName: nameById.get(link.vendorId) || link.vendorId });
      }
    }

    const locations = allCounts
      .map((c) => ({
        locationId: c.locationId,
        locationName: locationMeta.get(c.locationId)?.name || c.locationId,
        locationType: locationMeta.get(c.locationId)?.type || '',
        total: c._count.id,
        active: activeByLocation.get(c.locationId) || 0,
        servicesCovered: coveredServicesByLocation.get(c.locationId)?.size || 0,
        serviceVendors: serviceVendorsByLocation ? serviceVendorsByLocation.get(c.locationId) || [] : null,
      }))
      .filter((row) => !serviceVendorsByLocation || row.serviceVendors!.length > 0)
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      success: true,
      locations,
      totalLinks,
      activeLinks,
      coreServiceCount: coreServices.length,
      selectedService: selectedService ? { key: selectedService.key, name: selectedService.name } : null,
    });
  } catch (error: any) {
    logger.error('Manager vendors-by-location error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors by location', details: error?.message },
      { status: 500 }
    );
  }
}
