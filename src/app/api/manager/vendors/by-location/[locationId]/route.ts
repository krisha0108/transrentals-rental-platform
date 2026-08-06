import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { getCoreServiceCatalog } from '@/lib/services/vendor-service-status';

export const dynamic = 'force-dynamic';

// GET - Vendors approved for a single location, scoped to this manager's assignment.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> | { locationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { locationId } = resolvedParams;

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
    if (!assignedLocationIds.includes(locationId)) {
      return NextResponse.json(
        { error: 'Access denied. This location is not in your assigned locations.' },
        { status: 403 }
      );
    }

    const location = manager.manager_locations.find((ml) => ml.locationId === locationId)?.locations;
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const approvals = await prisma.vendor_approved_locations.findMany({
      where: { locationId, vendors: { status: 'APPROVED' } },
      include: {
        vendors: {
          select: { id: true, businessName: true, ownerName: true, email: true, phone: true, status: true },
        },
      },
      orderBy: [{ isActive: 'desc' }, { approvedAt: 'desc' }],
    });

    // Service coverage for this location — a location can show plenty of
    // vendors while still having zero coverage for a specific service,
    // since location and service approvals are independent grants.
    const coreServices = await getCoreServiceCatalog();
    const activeVendorIds = approvals.filter((a) => a.isActive).map((a) => a.vendors.id);
    const serviceLinks = activeVendorIds.length
      ? await prisma.vendor_approved_services.findMany({
          where: { vendorId: { in: activeVendorIds }, isActive: true, serviceId: { in: coreServices.map((s) => s.id) } },
          select: { vendorId: true, serviceId: true },
        })
      : [];
    const vendorNameById = new Map(approvals.map((a) => [a.vendors.id, a.vendors.businessName]));
    const vendorsByServiceId = new Map<string, { id: string; businessName: string }[]>();
    for (const link of serviceLinks) {
      if (!vendorsByServiceId.has(link.serviceId)) vendorsByServiceId.set(link.serviceId, []);
      vendorsByServiceId.get(link.serviceId)!.push({
        id: link.vendorId,
        businessName: vendorNameById.get(link.vendorId) || link.vendorId,
      });
    }
    const serviceCoverage = coreServices.map((s) => ({
      key: s.key,
      id: s.id,
      name: s.name,
      vendors: vendorsByServiceId.get(s.id) || [],
    }));

    return NextResponse.json({
      success: true,
      location: { id: location.id, name: location.name, type: location.type },
      vendors: approvals.map((a) => ({
        approvalId: a.id,
        isActiveHere: a.isActive,
        approvedAt: a.approvedAt,
        ...a.vendors,
      })),
      serviceCoverage,
    });
  } catch (error: any) {
    logger.error('Manager vendors-at-location error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors for location', details: error?.message },
      { status: 500 }
    );
  }
}
