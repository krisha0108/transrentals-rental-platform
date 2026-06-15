// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';
import crypto from 'crypto';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

export const dynamic = 'force-dynamic';

// POST - Bulk request multiple services
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guard = await vendorStatusGuard(auth.vendorId);
    if (guard.blocked) return guard.response;

    const body = await request.json();
    const { serviceIds, message, experience } = body;

    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json({ error: 'At least one service ID is required' }, { status: 400 });
    }

    // Validate all services exist
    const services = await prisma.services.findMany({
      where: { id: { in: serviceIds } },
    });

    if (services.length !== serviceIds.length) {
      return NextResponse.json({ error: 'Some services not found' }, { status: 404 });
    }

    // Get already approved services (only active ones — inactive = vendor removed them, can re-request)
    const alreadyApproved = await prisma.vendor_approved_services.findMany({
      where: {
        vendorId: auth.vendorId,
        serviceId: { in: serviceIds },
        isActive: true,
      },
      select: { serviceId: true },
    });
    const approvedIds = alreadyApproved.map((s) => s.serviceId);

    // Get pending requests
    const pendingRequests = await prisma.vendor_service_requests.findMany({
      where: {
        vendorId: auth.vendorId,
        serviceId: { in: serviceIds },
        status: 'PENDING',
      },
      select: { serviceId: true },
    });
    const pendingIds = pendingRequests.map((s) => s.serviceId);

    // Filter out already approved and pending services
    const newServiceIds = serviceIds.filter(
      (id: string) => !approvedIds.includes(id) && !pendingIds.includes(id)
    );

    if (newServiceIds.length === 0) {
      return NextResponse.json(
        { error: 'All selected services are already approved or have pending requests' },
        { status: 400 }
      );
    }

    // Create requests for all new services using transaction
    const results = await prisma.$transaction(
      newServiceIds.map((serviceId: string) =>
        prisma.vendor_service_requests.upsert({
          where: {
            vendorId_serviceId: {
              vendorId: auth.vendorId,
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
            vendorId: auth.vendorId,
            serviceId,
            message,
            experience,
            status: 'PENDING',
          },
        })
      )
    );

    return NextResponse.json(
      {
        message: `Successfully requested ${results.length} service(s)`,
        count: results.length,
        skipped: {
          alreadyApproved: approvedIds.length,
          alreadyPending: pendingIds.length,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Bulk service request error', error);
    return NextResponse.json(
      { error: 'Failed to submit requests', details: error?.message },
      { status: 500 }
    );
  }
}
