// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';

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

    // Generate IDs efficiently (single-row MAX queries instead of full table scans)
    const [maxIdResult, maxReqNumResult]: any[] = await Promise.all([
      prisma.$queryRaw`SELECT MAX(CAST(SUBSTRING(id, 5) AS UNSIGNED)) as maxNum FROM p2p_requests WHERE id LIKE 'PRQ_%'`,
      prisma.$queryRaw`SELECT MAX(CAST(SUBSTRING(requestNumber, 4) AS UNSIGNED)) as maxNum FROM p2p_requests WHERE requestNumber LIKE 'RQ-%'`,
    ]);
    const newId = `PRQ_${(Number(maxIdResult?.[0]?.maxNum) || 0) + 1}`;
    const newRequestNumber = `RQ-${(Number(maxReqNumResult?.[0]?.maxNum) || 1000) + 1}`;

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

    // Notify posting owner about the new vehicle request
    sendVendorDirectNotification({
      vendorId: posting.vendorId,
      title: '🚛 New Vehicle Request',
      body: `${newRequest.requestingVendor?.businessName || 'A vendor'} wants your ${posting.vehicleName || 'vehicle'} for ${posting.fromCity}→${posting.toCity}`,
      type: 'p2p_vehicle_requested',
      serviceType: 'p2p',
      bookingId: newRequest.id,
      bookingNumber: newRequest.requestNumber,
    }).catch((err: any) => console.error('[P2P] Notify failed:', err));

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
