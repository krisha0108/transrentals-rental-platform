import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get vendor requests for manager's assigned locations/services
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user and verify they are a manager
    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: {
        manager_locations: {
          include: { locations: true },
        },
        manager_services: {
          include: { services: true },
        },
      },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);
    const assignedServiceIds = manager.manager_services.map((ms) => ms.serviceId);

    // Get query params
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'location', 'service', 'all'
    const status = searchParams.get('status') || 'PENDING';

    const statusFilter = status === 'all' ? {} : { status: status as any };

    // Get location requests for assigned locations
    const locationRequests = (type === 'all' || type === 'location') && assignedLocationIds.length > 0
      ? await prisma.vendor_location_requests.findMany({
          where: {
            locationId: { in: assignedLocationIds },
            ...statusFilter,
          },
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                ownerName: true,
                phone: true,
                email: true,
                status: true,
              },
            },
            locations: {
              select: { id: true, name: true, slug: true, type: true },
            },
            admin_users: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    // Get service requests for assigned services
    const serviceRequests = (type === 'all' || type === 'service') && assignedServiceIds.length > 0
      ? await prisma.vendor_service_requests.findMany({
          where: {
            serviceId: { in: assignedServiceIds },
            ...statusFilter,
          },
          include: {
            vendors: {
              select: {
                id: true,
                businessName: true,
                ownerName: true,
                phone: true,
                email: true,
                status: true,
              },
            },
            services: {
              select: { id: true, name: true, slug: true },
            },
            admin_users: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    // Stats
    const pendingLocationRequests = assignedLocationIds.length > 0
      ? await prisma.vendor_location_requests.count({
          where: { locationId: { in: assignedLocationIds }, status: 'PENDING' },
        })
      : 0;

    const pendingServiceRequests = assignedServiceIds.length > 0
      ? await prisma.vendor_service_requests.count({
          where: { serviceId: { in: assignedServiceIds }, status: 'PENDING' },
        })
      : 0;

    return NextResponse.json({
      success: true,
      stats: {
        pendingLocationRequests,
        pendingServiceRequests,
        totalPending: pendingLocationRequests + pendingServiceRequests,
      },
      locationRequests: locationRequests.map((req) => ({
        id: req.id,
        type: 'location',
        vendorId: req.vendorId,
        vendorName: req.vendors.businessName,
        vendorOwner: req.vendors.ownerName,
        vendorPhone: req.vendors.phone,
        vendorEmail: req.vendors.email,
        vendorStatus: req.vendors.status,
        locationId: req.locationId,
        locationName: req.locations.name,
        locationType: req.locations.type,
        message: req.message,
        localAddress: req.localAddress,
        status: req.status,
        reviewedAt: req.reviewedAt,
        reviewedBy: req.admin_users?.name,
        rejectionReason: req.rejectionReason,
        createdAt: req.createdAt,
      })),
      serviceRequests: serviceRequests.map((req) => ({
        id: req.id,
        type: 'service',
        vendorId: req.vendorId,
        vendorName: req.vendors.businessName,
        vendorOwner: req.vendors.ownerName,
        vendorPhone: req.vendors.phone,
        vendorEmail: req.vendors.email,
        vendorStatus: req.vendors.status,
        serviceId: req.serviceId,
        serviceName: req.services.name,
        message: req.message,
        experience: req.experience,
        status: req.status,
        reviewedAt: req.reviewedAt,
        reviewedBy: req.admin_users?.name,
        rejectionReason: req.rejectionReason,
        createdAt: req.createdAt,
      })),
    });
  } catch (error: any) {
    logger.error('Manager vendor requests error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor requests', details: error?.message },
      { status: 500 }
    );
  }
}
