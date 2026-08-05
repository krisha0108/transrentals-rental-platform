import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
import { getManagersForService, notifyManagers } from '@/lib/notifications/manager-notify';
export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'vsr' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 21);
}

// GET - Get vendor's services (approved + pending requests)
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;


    // Get all parent services with their sub-services
    const allServices = await prisma.services.findMany({
      where: {
        parentId: null,
        isActive: true,
      },
      include: {
        other_services: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    // Get vendor's approved services — ALL of them, active or not, so a
    // deactivated service still shows on this page (with an "Inactive"
    // state + a way to switch it back on) instead of disappearing.
    const approvedServices = await prisma.vendor_approved_services.findMany({
      where: { vendorId: vendorId },
      select: { serviceId: true, isActive: true },
    });

    // Get vendor's pending requests
    const pendingRequests = await prisma.vendor_service_requests.findMany({
      where: { vendorId: vendorId },
      select: {
        id: true,
        serviceId: true,
        status: true,
        message: true,
        experience: true,
        rejectionReason: true,
        createdAt: true,
        services: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      allServices,
      approvedServiceIds: approvedServices.map((s) => s.serviceId),
      activeServiceIds: approvedServices.filter((s) => s.isActive).map((s) => s.serviceId),
      requests: pendingRequests,
    });
  } catch (error: any) {
    logger.error('Get services error', error);
    return NextResponse.json(
      { error: 'Failed to fetch services', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Withdraw a pending request OR remove an approved service
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const type = searchParams.get('type'); // 'request' | 'approved'

    if (!serviceId || !type) {
      return NextResponse.json({ error: 'serviceId and type are required' }, { status: 400 });
    }

    if (type === 'request') {
      // Withdraw a pending service request
      const existing = await prisma.vendor_service_requests.findUnique({
        where: { vendorId_serviceId: { vendorId, serviceId } },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      }
      if (existing.status !== 'PENDING') {
        return NextResponse.json({ error: 'Only pending requests can be withdrawn' }, { status: 400 });
      }
      await prisma.vendor_service_requests.delete({
        where: { vendorId_serviceId: { vendorId, serviceId } },
      });
      return NextResponse.json({ success: true, message: 'Service request withdrawn' });
    }

    if (type === 'approved') {
      // Deactivate an approved service
      const existing = await prisma.vendor_approved_services.findUnique({
        where: { vendorId_serviceId: { vendorId, serviceId } },
      });
      if (!existing) {
        return NextResponse.json({ error: 'Approved service not found' }, { status: 404 });
      }
      await prisma.vendor_approved_services.update({
        where: { vendorId_serviceId: { vendorId, serviceId } },
        data: { isActive: false },
      });
      return NextResponse.json({ success: true, message: 'Service deactivated — you will stop receiving new leads for it until you switch it back on.' });
    }

    return NextResponse.json({ error: 'Invalid type. Use "request" or "approved"' }, { status: 400 });
  } catch (error: any) {
    logger.error('Delete service error', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Reactivate a previously-deactivated approved service
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

    const body = await request.json();
    const { serviceId } = body;
    if (!serviceId) {
      return NextResponse.json({ error: 'serviceId is required' }, { status: 400 });
    }

    const existing = await prisma.vendor_approved_services.findUnique({
      where: { vendorId_serviceId: { vendorId, serviceId } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Approved service not found' }, { status: 404 });
    }

    await prisma.vendor_approved_services.update({
      where: { vendorId_serviceId: { vendorId, serviceId } },
      data: { isActive: true },
    });
    return NextResponse.json({ success: true, message: 'Service activated — you will start receiving new leads for it again.' });
  } catch (error: any) {
    logger.error('Reactivate service error', error);
    return NextResponse.json(
      { error: 'Failed to reactivate service', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Request a service
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;

    // Block rejected vendors from submitting new requests
    const vendor = await prisma.vendors.findUnique({
      where: { id: vendorId },
      select: { status: true, businessName: true },
    });
    if (!vendor || vendor.status === 'REJECTED') {
      return NextResponse.json({ error: 'Your account has been rejected. You cannot submit new requests.' }, { status: 403 });
    }

    const body = await request.json();
    const { serviceId, message, experience } = body;

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    // Check if service exists
    const service = await prisma.services.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Check if already approved
    const alreadyApproved = await prisma.vendor_approved_services.findUnique({
      where: {
        vendorId_serviceId: {
          vendorId: vendorId,
          serviceId,
        },
      },
    });
    if (alreadyApproved) {
      return NextResponse.json({ error: 'Service already approved' }, { status: 400 });
    }

    // Check if request already exists
    const existingRequest = await prisma.vendor_service_requests.findUnique({
      where: {
        vendorId_serviceId: {
          vendorId: vendorId,
          serviceId,
        },
      },
    });
    if (existingRequest && existingRequest.status === 'PENDING') {
      return NextResponse.json({ error: 'Request already pending' }, { status: 400 });
    }

    // Create or update request
    const serviceRequest = await prisma.vendor_service_requests.upsert({
      where: {
        vendorId_serviceId: {
          vendorId: vendorId,
          serviceId,
        },
      },
      update: {
        message,
        experience,
        status: 'PENDING',
        rejectionReason: null,
        reviewedAt: null,
        reviewedById: null,
      },
      create: {
        id: generateId(),
        vendorId: vendorId,
        serviceId,
        message,
        experience,
        status: 'PENDING',
      },
    });

    // Notify managers scoped to this service — never block the response on this.
    try {
      const managerIds = await getManagersForService(serviceId);
      const approvedServiceCount = await prisma.vendor_approved_services.count({
        where: { vendorId },
      });
      const isNewVendor = approvedServiceCount === 0;
      await notifyManagers(managerIds, {
        type: 'NEW_SERVICE_REQUEST',
        title: isNewVendor ? 'New vendor wants to offer this service' : 'Vendor requests an additional service',
        body: `${vendor.businessName} has requested ${service.name}${isNewVendor ? ' as their first service' : ''}.`,
        link: `/manager/vendors/${vendorId}?tab=services`,
        metadata: { vendorId, serviceId, requestId: serviceRequest.id, isNewVendor },
        dedupeKey: serviceRequest.id,
      });
    } catch (notifyError) {
      logger.error('Failed to notify managers of new service request', notifyError);
    }

    return NextResponse.json(serviceRequest, { status: 201 });
  } catch (error: any) {
    logger.error('Service request error', error);
    return NextResponse.json(
      { error: 'Failed to submit request', details: error?.message },
      { status: 500 }
    );
  }
}
