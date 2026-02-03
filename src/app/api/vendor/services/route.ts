import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
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
    const vendorId = auth.vendorId;

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

    // Get vendor's approved services
    const approvedServices = await prisma.vendor_approved_services.findMany({
      where: { vendorId: vendorId, isActive: true },
      select: { serviceId: true },
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

// POST - Request a service
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

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

    return NextResponse.json(serviceRequest, { status: 201 });
  } catch (error: any) {
    logger.error('Service request error', error);
    return NextResponse.json(
      { error: 'Failed to submit request', details: error?.message },
      { status: 500 }
    );
  }
}
