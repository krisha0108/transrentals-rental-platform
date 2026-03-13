import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'vlr' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 21);
}

// GET - Get vendor's locations (approved + pending requests)
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    // Get all states and union territories with their cities
    const states = await prisma.locations.findMany({
      where: {
        type: { in: ['STATE', 'UNION_TERRITORY'] },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        other_locations: {
          where: {
            type: 'CITY',
            isActive: true,
          },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Keep all locations - states with cities AND union territories without cities
    // Don't filter out UTs that have no children
    const allLocations = states.map(state => ({
      ...state,
      cities: state.other_locations,
      other_locations: undefined,
    }));

    // Get vendor's approved locations
    const approvedLocationsRaw = await prisma.vendor_approved_locations.findMany({
      where: { vendorId: vendorId, isActive: true },
      select: {
        id: true,
        isActive: true,
        locationId: true,
        locations: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            locations: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Transform to match frontend expectations: nested locations -> parent
    const approvedLocations = approvedLocationsRaw.map(item => ({
      id: item.id,
      isActive: item.isActive,
      locationId: item.locationId,
      locations: item.locations ? {
        id: item.locations.id,
        name: item.locations.name,
        slug: item.locations.slug,
        type: item.locations.type,
        parent: item.locations.locations ? {
          id: item.locations.locations.id,
          name: item.locations.locations.name,
        } : null,
      } : null,
    }));

    // Get approved location IDs for quick lookup
    const approvedLocationIds = approvedLocations.map((l) => l.locationId);

    // Get vendor's pending requests
    const pendingRequestsRaw = await prisma.vendor_location_requests.findMany({
      where: { vendorId: vendorId },
      select: {
        id: true,
        locationId: true,
        status: true,
        message: true,
        localAddress: true,
        rejectionReason: true,
        createdAt: true,
        locations: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            locations: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Transform to match frontend expectations: nested locations -> parent
    const pendingRequests = pendingRequestsRaw.map(req => ({
      id: req.id,
      locationId: req.locationId,
      status: req.status,
      message: req.message,
      localAddress: req.localAddress,
      rejectionReason: req.rejectionReason,
      createdAt: req.createdAt,
      locations: req.locations ? {
        id: req.locations.id,
        name: req.locations.name,
        slug: req.locations.slug,
        type: req.locations.type,
        parent: req.locations.locations ? {
          id: req.locations.locations.id,
          name: req.locations.locations.name,
        } : null,
      } : null,
    }));

    return NextResponse.json({
      allLocations,
      approvedLocations,
      approvedLocationIds,
      requests: pendingRequests,
    });
  } catch (error: any) {
    logger.error('Get locations error', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations', details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Withdraw a pending request OR remove an approved location
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const type = searchParams.get('type'); // 'request' | 'approved'

    // Read body only when Content-Type is JSON (bulk requests)
    let bodyData: any = null;
    if (request.headers.get('content-type')?.includes('application/json')) {
      try { bodyData = await request.json(); } catch {}
    }

    const effectiveType = type || bodyData?.type;
    const locationIds: string[] = bodyData?.locationIds?.length
      ? bodyData.locationIds
      : locationId ? [locationId] : [];

    if (!effectiveType || locationIds.length === 0) {
      return NextResponse.json({ error: 'locationId(s) and type are required' }, { status: 400 });
    }

    if (effectiveType === 'request') {
      if (locationIds.length === 1) {
        const existing = await prisma.vendor_location_requests.findUnique({
          where: { vendorId_locationId: { vendorId, locationId: locationIds[0] } },
        });
        if (!existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        if (existing.status !== 'PENDING') return NextResponse.json({ error: 'Only pending requests can be withdrawn' }, { status: 400 });
        await prisma.vendor_location_requests.delete({
          where: { vendorId_locationId: { vendorId, locationId: locationIds[0] } },
        });
      } else {
        await prisma.vendor_location_requests.deleteMany({
          where: { vendorId, locationId: { in: locationIds }, status: 'PENDING' },
        });
      }
      return NextResponse.json({ success: true, message: `${locationIds.length === 1 ? 'Location request withdrawn' : `${locationIds.length} requests withdrawn`}` });
    }

    if (effectiveType === 'approved') {
      if (locationIds.length === 1) {
        const existing = await prisma.vendor_approved_locations.findUnique({
          where: { vendorId_locationId: { vendorId, locationId: locationIds[0] } },
        });
        if (!existing) return NextResponse.json({ error: 'Approved location not found' }, { status: 404 });
        await prisma.vendor_approved_locations.update({
          where: { vendorId_locationId: { vendorId, locationId: locationIds[0] } },
          data: { isActive: false },
        });
      } else {
        await prisma.vendor_approved_locations.updateMany({
          where: { vendorId, locationId: { in: locationIds } },
          data: { isActive: false },
        });
      }
      return NextResponse.json({ success: true, message: `${locationIds.length === 1 ? 'Location removed successfully' : `${locationIds.length} locations removed`}` });
    }

    return NextResponse.json({ error: 'Invalid type. Use "request" or "approved"' }, { status: 400 });
  } catch (error: any) {
    logger.error('Delete location error', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Request a location
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const body = await request.json();
    const { locationId, message, localAddress } = body;

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
    }

    // Check if location exists
    const location = await prisma.locations.findUnique({
      where: { id: locationId },
    });
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Check if already approved
    const alreadyApproved = await prisma.vendor_approved_locations.findUnique({
      where: {
        vendorId_locationId: {
          vendorId: vendorId,
          locationId,
        },
      },
    });
    if (alreadyApproved) {
      return NextResponse.json({ error: 'Location already approved' }, { status: 400 });
    }

    // Check if request already exists
    const existingRequest = await prisma.vendor_location_requests.findUnique({
      where: {
        vendorId_locationId: {
          vendorId: vendorId,
          locationId,
        },
      },
    });
    if (existingRequest && existingRequest.status === 'PENDING') {
      return NextResponse.json({ error: 'Request already pending' }, { status: 400 });
    }

    // Create or update request
    const locationRequest = await prisma.vendor_location_requests.upsert({
      where: {
        vendorId_locationId: {
          vendorId: vendorId,
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
        vendorId: vendorId,
        locationId,
        message,
        localAddress,
        status: 'PENDING',
      },
    });

    return NextResponse.json(locationRequest, { status: 201 });
  } catch (error: any) {
    logger.error('Location request error', error);
    return NextResponse.json(
      { error: 'Failed to submit request', details: error?.message },
      { status: 500 }
    );
  }
}
