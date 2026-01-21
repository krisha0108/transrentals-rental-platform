import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get vendor details for manager
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id: vendorId } = resolvedParams;

    // Get current user and verify they are a manager
    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: {
        manager_locations: { include: { locations: true } },
        manager_services: { include: { services: true } },
      },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);
    const assignedServiceIds = manager.manager_services.map((ms) => ms.serviceId);

    // Get vendor with all details
    const vendor = await prisma.vendors.findUnique({
      where: { id: vendorId },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
          include: {
            verifiedBy: { select: { id: true, name: true, email: true } },
          },
        },
        serviceRequests: {
          orderBy: { createdAt: 'desc' },
          include: {
            services: { select: { id: true, name: true, slug: true } },
            reviewedBy: { select: { id: true, name: true } },
          },
        },
        locationRequests: {
          orderBy: { createdAt: 'desc' },
          include: {
            locations: {
              select: {
                id: true,
                name: true,
                slug: true,
                parentId: true,
                parent: { select: { name: true } },
              },
            },
            reviewedBy: { select: { id: true, name: true } },
          },
        },
        vendor_approved_services: {
          include: { services: { select: { id: true, name: true } } },
        },
        vendor_approved_locations: {
          include: {
            location: {
              select: {
                id: true,
                name: true,
                parent: { select: { name: true } },
              },
            },
          },
        },
        approvedBy: { select: { id: true, name: true, email: true } },
        _count: { select: { fleets: true } },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check if manager has access to this vendor (via approved locations)
    const hasAccess = vendor.vendor_approved_locations.some((al) =>
      assignedLocationIds.includes(al.locationId)
    ) || vendor.locationRequests.some((lr) =>
      assignedLocationIds.includes(lr.locationId)
    );

    if (!hasAccess && assignedLocationIds.length > 0) {
      return NextResponse.json(
        { error: 'Access denied. This vendor is not in your assigned locations.' },
        { status: 403 }
      );
    }

    // Filter location requests to only show those in manager's assigned locations
    const filteredLocationRequests = vendor.locationRequests.filter((lr) =>
      assignedLocationIds.includes(lr.locationId)
    );

    // Filter service requests to only show those in manager's assigned services
    const filteredServiceRequests = vendor.serviceRequests.filter((sr) =>
      assignedServiceIds.includes(sr.serviceId)
    );

    return NextResponse.json({
      success: true,
      vendors: {
        id: vendor.id,
        businessName: vendor.businessName,
        ownerName: vendor.ownerName,
        email: vendor.email,
        phone: vendor.phone,
        address: vendor.address,
        city: vendor.city,
        state: vendor.state,
        pincode: vendor.pincode,
        gstNumber: vendor.gstNumber,
        panNumber: vendor.panNumber,
        status: vendor.status,
        rejectionReason: vendor.rejectionReason,
        createdAt: vendor.createdAt,
        approvedAt: vendor.approvedAt,
        approvedBy: vendor.approvedBy,
        documents: vendor.documents,
        serviceRequests: filteredServiceRequests,
        locationRequests: filteredLocationRequests,
        vendor_approved_services: vendor.vendor_approved_services,
        vendor_approved_locations: vendor.vendor_approved_locations.filter((al) =>
          assignedLocationIds.includes(al.locationId)
        ),
        allApprovedLocations: vendor.vendor_approved_locations,
        allApprovedServices: vendor.vendor_approved_services,
        _count: vendor._count,
      },
      managerAccess: {
        canApproveLocationRequests: filteredLocationRequests.filter((r) => r.status === 'PENDING').length > 0,
        canApproveServiceRequests: filteredServiceRequests.filter((r) => r.status === 'PENDING').length > 0,
        assignedLocationIds,
        assignedServiceIds,
      },
    });
  } catch (error: any) {
    logger.error('Manager vendor detail error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor', details: error?.message },
      { status: 500 }
    );
  }
}
