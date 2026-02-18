import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';
export const dynamic = 'force-dynamic';

// PUT - Approve or reject a vendor request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = 'then' in params ? await params : params;
    const { id: requestId } = resolvedParams;

    // Get current user and verify they are a manager
    const manager = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      include: {
        manager_locations: true,
        manager_services: true,
      },
    });

    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const assignedLocationIds = manager.manager_locations.map((ml) => ml.locationId);
    const assignedServiceIds = manager.manager_services.map((ms) => ms.serviceId);

    const body = await request.json();
    const { type, action, reason } = body;

    if (!type || !['location', 'service'].includes(type)) {
      return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (type === 'location') {
      // Handle location request
      const locationRequest = await prisma.vendor_location_requests.findUnique({
        where: { id: requestId },
        include: {
          vendor: true,
          location: true,
        },
      });

      if (!locationRequest) {
        return NextResponse.json({ error: 'Location request not found' }, { status: 404 });
      }

      // Check if manager has access to this location
      if (!assignedLocationIds.includes(locationRequest.locationId)) {
        return NextResponse.json(
          { error: 'Access denied. You are not assigned to this location.' },
          { status: 403 }
        );
      }

      if (locationRequest.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Request has already been processed' },
          { status: 400 }
        );
      }

      if (action === 'approve') {
        // Approve: Update request and create approved location entry
        await prisma.$transaction(async (tx) => {
          // Update request status
          await tx.vendorLocationRequest.update({
            where: { id: requestId },
            data: {
              status: 'APPROVED',
              reviewedAt: new Date(),
              reviewedById: manager.id,
            },
          });

          // Create approved location entry
          await tx.vendorApprovedLocation.upsert({
            where: {
              vendorId_locationId: {
                vendorId: locationRequest.vendorId,
                locationId: locationRequest.locationId,
              },
            },
            create: {
              vendorId: locationRequest.vendorId,
              locationId: locationRequest.locationId,
              isActive: true,
            },
            update: {
              isActive: true,
            },
          });
        });

        sendVendorDirectNotification({
          vendorId: locationRequest.vendorId,
          title: '📍 Location Approved',
          body: `Your request for ${locationRequest.location?.name || 'the location'} has been approved. You can now start accepting bookings in this area.`,
          type: 'location_approved',
          serviceType: 'general',
        }).catch((err: any) => console.error('[ManagerLocApprove] Vendor notify failed:', err));

        return NextResponse.json({
          success: true,
          message: `Location request approved. ${locationRequest.vendor.businessName} can now operate in ${locationRequest.locations.name}.`,
        });
      } else {
        // Reject
        await prisma.vendor_location_requests.update({
          where: { id: requestId },
          data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            reviewedById: manager.id,
            rejectionReason: reason || 'Rejected by manager',
          },
        });

        sendVendorDirectNotification({
          vendorId: locationRequest.vendorId,
          title: '❌ Location Request Rejected',
          body: `Your request for ${locationRequest.location?.name || 'the location'} was rejected. ${reason ? 'Reason: ' + reason : 'Please contact support for more information.'}.`,
          type: 'location_rejected',
          serviceType: 'general',
        }).catch((err: any) => console.error('[ManagerLocReject] Vendor notify failed:', err));

        return NextResponse.json({
          success: true,
          message: 'Location request rejected.',
        });
      }
    } else {
      // Handle service request
      const serviceRequest = await prisma.vendor_service_requests.findUnique({
        where: { id: requestId },
        include: {
          vendor: true,
          service: true,
        },
      });

      if (!serviceRequest) {
        return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
      }

      // Check if manager has access to this service
      if (!assignedServiceIds.includes(serviceRequest.serviceId)) {
        return NextResponse.json(
          { error: 'Access denied. You are not assigned to this service.' },
          { status: 403 }
        );
      }

      if (serviceRequest.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Request has already been processed' },
          { status: 400 }
        );
      }

      if (action === 'approve') {
        // Approve: Update request and create approved service entry
        await prisma.$transaction(async (tx) => {
          // Update request status
          await tx.vendorServiceRequest.update({
            where: { id: requestId },
            data: {
              status: 'APPROVED',
              reviewedAt: new Date(),
              reviewedById: manager.id,
            },
          });

          // Create approved service entry
          await tx.vendorApprovedService.upsert({
            where: {
              vendorId_serviceId: {
                vendorId: serviceRequest.vendorId,
                serviceId: serviceRequest.serviceId,
              },
            },
            create: {
              vendorId: serviceRequest.vendorId,
              serviceId: serviceRequest.serviceId,
              isActive: true,
            },
            update: {
              isActive: true,
            },
          });
        });

        sendVendorDirectNotification({
          vendorId: serviceRequest.vendorId,
          title: '🎉 Service Approved',
          body: `Your request for ${serviceRequest.service?.name || 'the service'} has been approved. You can now start offering this service.`,
          type: 'service_approved',
          serviceType: 'general',
        }).catch((err: any) => console.error('[ManagerSvcApprove] Vendor notify failed:', err));

        return NextResponse.json({
          success: true,
          message: `Service request approved. ${serviceRequest.vendor.businessName} can now offer ${serviceRequest.services.name}.`,
        });
      } else {
        // Reject
        await prisma.vendor_service_requests.update({
          where: { id: requestId },
          data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            reviewedById: manager.id,
            rejectionReason: reason || 'Rejected by manager',
          },
        });

        sendVendorDirectNotification({
          vendorId: serviceRequest.vendorId,
          title: '❌ Service Request Rejected',
          body: `Your request for ${serviceRequest.service?.name || 'the service'} was rejected. ${reason ? 'Reason: ' + reason : 'Please contact support for more information.'}.`,
          type: 'service_rejected',
          serviceType: 'general',
        }).catch((err: any) => console.error('[ManagerSvcReject] Vendor notify failed:', err));

        return NextResponse.json({
          success: true,
          message: 'Service request rejected.',
        });
      }
    }
  } catch (error: any) {
    logger.error('Manager vendor request update error', error);
    return NextResponse.json(
      { error: 'Failed to update vendor request', details: error?.message },
      { status: 500 }
    );
  }
}
