import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

export const dynamic = 'force-dynamic';

// PUT - Approve/Reject service request (single or bulk)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id: vendorId } = await params;
    const body = await request.json();
    const { requestId, requestIds, action, rejectionReason, bulk, commissionPercent } = body;

    // Parse and validate commissionPercent
    const commission = commissionPercent !== undefined
      ? Math.min(100, Math.max(0, parseFloat(commissionPercent) || 0))
      : 0;

    // Handle bulk operations
    if (bulk && requestIds && Array.isArray(requestIds)) {
      // Get all pending service requests for bulk operation
      const pendingRequests = await prisma.vendor_service_requests.findMany({
        where: {
          id: { in: requestIds },
          vendorId,
          status: 'PENDING',
        },
      });

      if (action === 'APPROVE_ALL') {
        // Update all requests to approved
        await prisma.vendor_service_requests.updateMany({
          where: {
            id: { in: requestIds },
            vendorId,
            status: 'PENDING',
          },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedById: session.user.id,
            rejectionReason: null,
          },
        });

        // Create approved service entries for each
        for (const req of pendingRequests) {
          await prisma.vendor_approved_services.upsert({
            where: {
              vendorId_serviceId: {
                vendorId,
                serviceId: req.serviceId,
              },
            },
            update: { isActive: true, commissionPercent: commission },
            create: {
              id: generateId(),
              vendorId,
              serviceId: req.serviceId,
              isActive: true,
              commissionPercent: commission,
            },
          });
        }

        sendVendorDirectNotification({
          vendorId,
          title: '🎉 Services Approved',
          body: `${pendingRequests.length} service${pendingRequests.length > 1 ? 's have' : ' has'} been approved. You can now start offering these services.`,
          type: 'service_approved',
          serviceType: 'general',
        }).catch((err: any) => console.error('[SvcApprove] Vendor notify failed:', err));
        return NextResponse.json({ success: true, message: `Approved ${pendingRequests.length} service requests` });
      } else if (action === 'REJECT_ALL') {
        if (!rejectionReason) {
          return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
        }
        await prisma.vendor_service_requests.updateMany({
          where: {
            id: { in: requestIds },
            vendorId,
            status: 'PENDING',
          },
          data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
            reviewedById: session.user.id,
            rejectionReason,
          },
        });
        sendVendorDirectNotification({
          vendorId,
          title: '❌ Service Requests Rejected',
          body: `${pendingRequests.length} service request${pendingRequests.length > 1 ? 's have' : ' has'} been rejected. Reason: ${rejectionReason}.`,
          type: 'service_rejected',
          serviceType: 'general',
        }).catch((err: any) => console.error('[SvcReject] Vendor notify failed:', err));
        return NextResponse.json({ success: true, message: `Rejected ${pendingRequests.length} service requests` });
      }
    }

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action are required' }, { status: 400 });
    }

    const serviceRequest = await prisma.vendor_service_requests.findFirst({
      where: { id: requestId, vendorId },
    });

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      // Update request status
      await prisma.vendor_service_requests.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedById: session.user.id,
          rejectionReason: null,
        },
      });

      // Create approved service entry with commission
      await prisma.vendor_approved_services.upsert({
        where: {
          vendorId_serviceId: {
            vendorId,
            serviceId: serviceRequest.serviceId,
          },
        },
        update: { isActive: true, commissionPercent: commission },
        create: {
          id: generateId(),
          vendorId,
          serviceId: serviceRequest.serviceId,
          isActive: true,
          commissionPercent: commission,
        },
      });

      sendVendorDirectNotification({
        vendorId,
        title: '🎉 Service Approved',
        body: `Your service request has been approved. You can now start offering this service on the platform.`,
        type: 'service_approved',
        serviceType: 'general',
      }).catch((err: any) => console.error('[SvcApprove] Vendor notify failed:', err));
    } else if (action === 'REJECT') {
      if (!rejectionReason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      await prisma.vendor_service_requests.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedById: session.user.id,
          rejectionReason,
        },
      });

      sendVendorDirectNotification({
        vendorId,
        title: '❌ Service Request Rejected',
        body: `Your service request was rejected. Reason: ${rejectionReason}.`,
        type: 'service_rejected',
        serviceType: 'general',
      }).catch((err: any) => console.error('[SvcReject] Vendor notify failed:', err));
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Update service request error', error);
    return NextResponse.json(
      { error: 'Failed to update service request', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update commission % for an already-approved service
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id: vendorId } = await params;
    const body = await request.json();
    const { approvedServiceId, commissionPercent } = body;

    if (!approvedServiceId || commissionPercent === undefined) {
      return NextResponse.json({ error: 'approvedServiceId and commissionPercent are required' }, { status: 400 });
    }

    const commission = Math.min(100, Math.max(0, parseFloat(commissionPercent) || 0));

    const updated = await prisma.vendor_approved_services.update({
      where: { id: approvedServiceId, vendorId },
      data: { commissionPercent: commission },
      include: { services: { select: { id: true, name: true, slug: true } } },
    });

    return NextResponse.json({ success: true, approvedService: updated });
  } catch (error: any) {
    logger.error('Update commission error', error);
    return NextResponse.json(
      { error: 'Failed to update commission', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Permanently remove an approved service and notify vendor.
// This is a real hard delete (unlike the vendor's own Active/Inactive
// toggle on /vendor/services, which only soft-deactivates and is fully
// reversible by the vendor themselves). Use this when an approval was
// granted in error or should be fully revoked — the vendor would need to
// submit a fresh request (and get re-approved) to get it back. The
// original vendor_service_requests row is left untouched as a historical
// record ("this was approved on this date by this reviewer") — deleting
// the live approval doesn't rewrite that history.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id: vendorId } = await params;
    const { searchParams } = new URL(request.url);
    const approvedServiceId = searchParams.get('approvedServiceId');

    // Bulk delete — body contains approvedServiceIds array
    let bodyData: any = null;
    try { bodyData = await request.json(); } catch {}

    if (bodyData?.approvedServiceIds && Array.isArray(bodyData.approvedServiceIds)) {
      const ids: string[] = bodyData.approvedServiceIds;
      if (ids.length === 0) {
        return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
      }
      const services = await prisma.vendor_approved_services.findMany({
        where: { id: { in: ids }, vendorId },
        include: { services: { select: { name: true } } },
      });
      if (services.length === 0) {
        return NextResponse.json({ error: 'No matching services found' }, { status: 404 });
      }
      await prisma.vendor_approved_services.deleteMany({
        where: { id: { in: ids }, vendorId },
      });
      sendVendorDirectNotification({
        vendorId,
        title: '🚫 Services Removed',
        body: `${services.length} service${services.length > 1 ? 's have' : ' has'} been removed by the admin.`,
        type: 'service_rejected',
        serviceType: 'general',
      }).catch((err: any) => console.error('[SvcBulkDelete] Vendor notify failed:', err));
      return NextResponse.json({ success: true, message: `Permanently removed ${services.length} service(s)` });
    }

    if (!approvedServiceId) {
      return NextResponse.json({ error: 'approvedServiceId is required' }, { status: 400 });
    }

    const approvedService = await prisma.vendor_approved_services.findFirst({
      where: { id: approvedServiceId, vendorId },
      include: { services: { select: { name: true } } },
    });

    if (!approvedService) {
      return NextResponse.json({ error: 'Approved service not found' }, { status: 404 });
    }

    await prisma.vendor_approved_services.delete({
      where: { id: approvedServiceId },
    });

    const serviceName = approvedService.services?.name || 'the service';

    sendVendorDirectNotification({
      vendorId,
      title: '🚫 Service Removed',
      body: `Your access to ${serviceName} has been removed by the admin.`,
      type: 'service_rejected',
      serviceType: 'general',
    }).catch((err: any) => console.error('[SvcDelete] Vendor notify failed:', err));

    return NextResponse.json({ success: true, message: 'Service permanently removed' });
  } catch (error: any) {
    logger.error('Delete approved service error', error);
    return NextResponse.json(
      { error: 'Failed to remove service', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Directly add service(s) to vendor (no request flow, manager/admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
    });

    if (!currentUser || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id: vendorId } = await params;
    const body = await request.json();
    const { serviceIds } = body; // array of serviceIds

    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json({ error: 'serviceIds array is required' }, { status: 400 });
    }

    for (const serviceId of serviceIds) {
      await prisma.vendor_approved_services.upsert({
        where: { vendorId_serviceId: { vendorId, serviceId } },
        update: { isActive: true },
        create: { id: generateId(), vendorId, serviceId, isActive: true, commissionPercent: 0 },
      });
    }

    sendVendorDirectNotification({
      vendorId,
      title: '🎉 Services Added',
      body: `${serviceIds.length} service${serviceIds.length > 1 ? 's have' : ' has'} been added to your profile.`,
      type: 'service_approved',
      serviceType: 'general',
    }).catch((err: any) => console.error('[SvcAdd] Vendor notify failed:', err));

    return NextResponse.json({ success: true, message: `${serviceIds.length} service(s) added` });
  } catch (error: any) {
    logger.error('Add services error', error);
    return NextResponse.json(
      { error: 'Failed to add services', details: error?.message },
      { status: 500 }
    );
  }
}
