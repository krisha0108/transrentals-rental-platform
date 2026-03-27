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
        vendor_documents: {
          orderBy: { createdAt: 'desc' },
          include: {
            admin_users: { select: { id: true, name: true, email: true } },
            uploadedByAdmin: { select: { id: true, name: true, role: true } },
          },
        },
        vendor_service_requests: {
          orderBy: { createdAt: 'desc' },
          include: {
            services: { select: { id: true, name: true, slug: true } },
            admin_users: { select: { id: true, name: true } },
          },
        },
        vendor_location_requests: {
          orderBy: { createdAt: 'desc' },
          include: {
            locations: {
              select: {
                id: true,
                name: true,
                slug: true,
                parentId: true,
                locations: { select: { name: true } },
              },
            },
            admin_users: { select: { id: true, name: true } },
          },
        },
        vendor_approved_services: {
          include: { services: { select: { id: true, name: true } } },
        },
        vendor_approved_locations: {
          include: {
            locations: {
              select: {
                id: true,
                name: true,
                parentId: true,
                locations: { select: { name: true } },
              },
            },
          },
        },
        admin_users: { select: { id: true, name: true, email: true } },
        vendor_fleets: {
          orderBy: { createdAt: 'desc' },
          include: {
            vehicle_models: {
              select: {
                id: true,
                name: true,
                sideImage: true,
                fuelType: true,
                transmission: true,
                seatingCapacity: true,
                engineCC: true,
                brands: { select: { name: true, logo: true } },
              },
            },
            services: { select: { id: true, name: true } },
            brands: { select: { name: true, logo: true } },
            chauffeur_vehicle_categories: { select: { name: true } },
            vendor_fleet_locations: {
              include: {
                locations: { select: { name: true } },
              },
            },
          },
        },
        _count: { select: { vendor_fleets: true } },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check if manager has access to this vendor (via approved locations)
    const hasAccess = vendor.vendor_approved_locations.some((al) =>
      assignedLocationIds.includes(al.locationId)
    ) || vendor.vendor_location_requests.some((lr) =>
      assignedLocationIds.includes(lr.locationId)
    );

    if (!hasAccess && assignedLocationIds.length > 0) {
      return NextResponse.json(
        { error: 'Access denied. This vendor is not in your assigned locations.' },
        { status: 403 }
      );
    }

    // Filter location requests to only show those in manager's assigned locations
    const filteredLocationRequests = vendor.vendor_location_requests.filter((lr) =>
      assignedLocationIds.includes(lr.locationId)
    );

    // Filter service requests to only show those in manager's assigned services
    const filteredServiceRequests = vendor.vendor_service_requests.filter((sr) =>
      assignedServiceIds.includes(sr.serviceId)
    );

    return NextResponse.json({
      success: true,
      vendor: {
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
        approvedBy: vendor.admin_users,
        documents: vendor.vendor_documents.map((doc) => ({
          ...doc,
          verifiedBy: doc.admin_users,
          uploadedBy: (doc as any).uploadedByAdmin,
          uploadedByAdmin: undefined,
        })),
        serviceRequests: filteredServiceRequests.map((req) => ({
          ...req,
          service: req.services,
          reviewedBy: req.admin_users,
        })),
        locationRequests: filteredLocationRequests.map((req) => ({
          ...req,
          location: req.locations,
          reviewedBy: req.admin_users,
        })),
        approvedServices: vendor.vendor_approved_services.map((item) => ({
          ...item,
          service: item.services,
        })),
        approvedLocations: vendor.vendor_approved_locations
          .filter((al) => assignedLocationIds.includes(al.locationId))
          .map((item) => ({
            ...item,
            location: item.locations,
          })),
        allApprovedLocations: vendor.vendor_approved_locations.map((item) => ({
          ...item,
          location: item.locations,
        })),
        allApprovedServices: vendor.vendor_approved_services.map((item) => ({
          ...item,
          service: item.services,
        })),
        fleets: vendor.vendor_fleets.map((f: any) => {
          // Parse images safely
          let images = null;
          try {
            if (f.images && typeof f.images === 'string' && f.images !== 'null') {
              images = JSON.parse(f.images);
            }
          } catch {}
          return {
            id: f.id,
            isActive: f.isActive,
            isAvailable: f.isAvailable,
            registrationNumber: f.registrationNumber || null,
            vehicleName: f.vehicle_models?.name || f.vehicleName || 'Unknown',
            brandName: f.vehicle_models?.brands?.name || f.brands?.name || null,
            brandLogo: f.vehicle_models?.brands?.logo || f.brands?.logo || null,
            categoryName: f.chauffeur_vehicle_categories?.name || null,
            serviceName: f.services?.name || null,
            sideImage: f.vehicle_models?.sideImage || null,
            images,
            fuelType: f.vehicle_models?.fuelType || f.fuelType || null,
            transmission: f.vehicle_models?.transmission || f.transmission || null,
            seatingCapacity: f.vehicle_models?.seatingCapacity || f.seatingCapacity || null,
            engineCC: f.vehicle_models?.engineCC || null,
            color: f.color || null,
            yearOfManufacture: f.yearOfManufacture || null,
            vehicleCondition: f.vehicleCondition || null,
            createdAt: f.createdAt,
            locations: f.vendor_fleet_locations.map((fl: any) => fl.locations.name),
          };
        }),
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
