import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Get vendor's locations (approved + pending requests)
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    // Get all states with their cities
    const states = await prisma.locations.findMany({
      where: {
        type: 'STATE',
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

    // Filter out states with no cities and rename for frontend compatibility
    const allLocations = states
      .filter(state => state.other_locations.length > 0)
      .map(state => ({
        ...state,
        cities: state.other_locations,
        other_locations: undefined,
      }));

    // Get vendor's approved locations
    const approvedLocations = await prisma.vendor_approved_locations.findMany({
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
              select: { name: true },
            },
          },
        },
      },
    });

    // Get approved location IDs for quick lookup
    const approvedLocationIds = approvedLocations.map((l) => l.locationId);

    // Get vendor's pending requests
    const pendingRequests = await prisma.vendor_location_requests.findMany({
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
              select: { name: true },
            },
          },
        },
      },
    });

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
