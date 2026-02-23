import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// GET - List all location requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const requests = await prisma.vendor_location_requests.findMany({
      where,
      include: {
        locations: {
          select: {
            id: true,
            name: true,
            slug: true,
            locations: { select: { name: true } },
          },
        },
        vendors: {
          select: { id: true, businessName: true, ownerName: true },
        },
        admin_users: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to frontend expected format
    const transformedRequests = requests.map((req: any) => ({
      ...req,
      location: req.locations ? {
        ...req.locations,
        parent: req.locations.locations,
        locations: undefined,
      } : null,
      vendor: req.vendors,
      reviewedBy: req.admin_users,
      locations: undefined,
      vendors: undefined,
      admin_users: undefined,
    }));

    return NextResponse.json({ requests: transformedRequests });
  } catch (error: any) {
    logger.error('Get location requests error', error);
    return NextResponse.json(
      { error: 'Failed to fetch location requests', details: error?.message },
      { status: 500 }
    );
  }
}

// PUT - Approve all pending location requests (global)
export async function PUT(request: NextRequest) {
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

    // Fetch all pending requests
    const pendingRequests = await prisma.vendor_location_requests.findMany({
      where: { status: 'PENDING' },
      include: { locations: { select: { name: true } } },
    });

    if (pendingRequests.length === 0) {
      return NextResponse.json({ success: true, message: 'No pending requests to approve', count: 0 });
    }

    // Bulk update all to APPROVED
    await prisma.vendor_location_requests.updateMany({
      where: { status: 'PENDING' },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedById: session.user.id,
        rejectionReason: null,
      },
    });

    // Create approved location entries for each
    for (const req of pendingRequests) {
      await prisma.vendor_approved_locations.upsert({
        where: { vendorId_locationId: { vendorId: req.vendorId, locationId: req.locationId } },
        update: { isActive: true },
        create: {
          id: generateId(),
          vendorId: req.vendorId,
          locationId: req.locationId,
          isActive: true,
        },
      });
    }

    // Send notifications grouped by vendor
    const byVendor = new Map<string, typeof pendingRequests>();
    for (const req of pendingRequests) {
      if (!byVendor.has(req.vendorId)) byVendor.set(req.vendorId, []);
      byVendor.get(req.vendorId)!.push(req);
    }

    for (const [vendorId, reqs] of byVendor) {
      sendVendorDirectNotification({
        vendorId,
        title: '📍 Locations Approved',
        body: `${reqs.length} location${reqs.length > 1 ? 's have' : ' has'} been approved. You can now start accepting bookings in ${reqs.length > 1 ? 'these areas' : reqs[0]?.locations?.name || 'the approved area'}.`,
        type: 'location_approved',
        serviceType: 'general',
      }).catch((err: any) => console.error('[LocApproveAll] Vendor notify failed:', err));
    }

    return NextResponse.json({
      success: true,
      message: `Approved ${pendingRequests.length} location request${pendingRequests.length > 1 ? 's' : ''}`,
      count: pendingRequests.length,
    });
  } catch (error: any) {
    logger.error('Approve all location requests error', error);
    return NextResponse.json(
      { error: 'Failed to approve all requests', details: error?.message },
      { status: 500 }
    );
  }
}
