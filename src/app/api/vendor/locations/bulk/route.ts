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

// POST - Bulk request multiple locations
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const guard = await vendorStatusGuard(auth.vendorId);
    if (guard.blocked) return guard.response;

    const body = await request.json();
    const { locationIds, message, localAddress } = body;

    if (!locationIds || !Array.isArray(locationIds) || locationIds.length === 0) {
      return NextResponse.json({ error: 'At least one location ID is required' }, { status: 400 });
    }

    // Validate all locations exist
    const locations = await prisma.locations.findMany({
      where: { id: { in: locationIds } },
    });

    if (locations.length !== locationIds.length) {
      return NextResponse.json({ error: 'Some locations not found' }, { status: 404 });
    }

    // Get already approved locations (only active ones)
    const alreadyApproved = await prisma.vendor_approved_locations.findMany({
      where: {
        vendorId: auth.vendorId,
        locationId: { in: locationIds },
        isActive: true,
      },
      select: { locationId: true },
    });
    const approvedIds = alreadyApproved.map((l) => l.locationId);

    // Get pending requests
    const pendingRequests = await prisma.vendor_location_requests.findMany({
      where: {
        vendorId: auth.vendorId,
        locationId: { in: locationIds },
        status: 'PENDING',
      },
      select: { locationId: true },
    });
    const pendingIds = pendingRequests.map((l) => l.locationId);

    // Filter out already approved and pending locations
    const newLocationIds = locationIds.filter(
      (id: string) => !approvedIds.includes(id) && !pendingIds.includes(id)
    );

    if (newLocationIds.length === 0) {
      return NextResponse.json(
        { error: 'All selected locations are already approved or have pending requests' },
        { status: 400 }
      );
    }

    // Create requests for all new locations using transaction
    const results = await prisma.$transaction(
      newLocationIds.map((locationId: string) =>
        prisma.vendor_location_requests.upsert({
          where: {
            vendorId_locationId: {
              vendorId: auth.vendorId,
              locationId,
            },
          },
          update: {
            message,
            localAddress,
            status: 'PENDING',
            rejectionReason: null,
            reviewedAt: null,
            reviewedById: null,
          },
          create: {
            id: generateId(),
            vendorId: auth.vendorId,
            locationId,
            message,
            localAddress,
            status: 'PENDING',
          },
        })
      )
    );

    return NextResponse.json(
      {
        message: `Successfully requested ${results.length} location(s)`,
        count: results.length,
        skipped: {
          alreadyApproved: approvedIds.length,
          alreadyPending: pendingIds.length,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Bulk location request error', error);
    return NextResponse.json(
      { error: 'Failed to submit requests', details: error?.message },
      { status: 500 }
    );
  }
}
