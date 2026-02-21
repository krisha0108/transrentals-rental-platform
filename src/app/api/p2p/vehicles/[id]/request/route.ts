// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// POST - Request a vehicle posting
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: postingId } = params;

    // Fetch the posting
    const posting = await prisma.p2p_vehicle_postings.findUnique({
      where: { id: postingId },
    });

    if (!posting) {
      return NextResponse.json(
        { success: false, error: 'Vehicle posting not found' },
        { status: 404 }
      );
    }

    // Cannot request own posting
    if (posting.vendorId === auth.vendorId) {
      return NextResponse.json(
        { success: false, error: 'You cannot request your own posting' },
        { status: 400 }
      );
    }

    // Posting must be active
    if (posting.status !== 'ACTIVE' && posting.status !== 'REQUESTED') {
      return NextResponse.json(
        { success: false, error: 'This posting is no longer available for requests' },
        { status: 400 }
      );
    }

    // Check for existing PENDING request from this vendor on the same posting
    const existingRequest = await prisma.p2p_requests.findFirst({
      where: {
        vehiclePostingId: postingId,
        requestingVendorId: auth.vendorId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { success: false, error: 'You already have a pending request on this posting' },
        { status: 400 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { notes, loadType, goodsType, estimatedWeight, pickupAddress, dropAddress } = body;

    // Generate unique ID with PRQ_ prefix
    const allIds = await prisma.p2p_requests.findMany({
      where: { id: { startsWith: 'PRQ_' } },
      select: { id: true },
    });
    const maxId = allIds.reduce((max, item) => {
      const num = parseInt(item.id.replace('PRQ_', ''));
      return num > max ? num : max;
    }, 0);
    const newId = `PRQ_${maxId + 1}`;

    // Generate unique request number with RQ- prefix
    const allRequestNumbers = await prisma.p2p_requests.findMany({
      where: { requestNumber: { startsWith: 'RQ-' } },
      select: { requestNumber: true },
    });
    const maxReqNum = allRequestNumbers.reduce((max, item) => {
      const num = parseInt(item.requestNumber.replace('RQ-', ''));
      return num > max ? num : max;
    }, 1000);
    const newRequestNumber = `RQ-${maxReqNum + 1}`;

    // Create the request and optionally update posting status in a transaction
    const [newRequest] = await prisma.$transaction([
      prisma.p2p_requests.create({
        data: {
          id: newId,
          requestNumber: newRequestNumber,
          postingType: 'VEHICLE',
          vehiclePostingId: postingId,
          requestingVendorId: auth.vendorId,
          postingVendorId: posting.vendorId,
          notes: notes || null,
          loadType: loadType || null,
          goodsType: goodsType || null,
          estimatedWeight: estimatedWeight || null,
          pickupAddress: pickupAddress || null,
          dropAddress: dropAddress || null,
          status: 'PENDING',
        },
        include: {
          requestingVendor: {
            select: {
              id: true,
              businessName: true,
              city: true,
              rating: true,
              totalRatings: true,
              logo: true,
            },
          },
          vehiclePosting: {
            select: {
              id: true,
              postingNumber: true,
              vehicleName: true,
              fromCity: true,
              toCity: true,
              departureDate: true,
            },
          },
        },
      }),
      // Update posting status to REQUESTED if it is currently ACTIVE (first request)
      prisma.p2p_vehicle_postings.update({
        where: { id: postingId },
        data: {
          status: posting.status === 'ACTIVE' ? 'REQUESTED' : posting.status,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      request: newRequest,
      message: 'Request sent successfully',
    });
  } catch (error: any) {
    logger.error('P2P vehicle request create error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create request' },
      { status: 500 }
    );
  }
}
