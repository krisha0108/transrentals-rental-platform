// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Get single request by ID with full details
export async function GET(
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

    const { id } = params;

    const p2pRequest = await prisma.p2p_requests.findUnique({
      where: { id },
      include: {
        vehiclePosting: true,
        bookingPosting: true,
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
        postingVendor: {
          select: {
            id: true,
            businessName: true,
            city: true,
            rating: true,
            totalRatings: true,
            logo: true,
          },
        },
      },
    });

    if (!p2pRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    // Only the requesting vendor or the posting vendor can view this request
    if (
      p2pRequest.requestingVendorId !== auth.vendorId &&
      p2pRequest.postingVendorId !== auth.vendorId
    ) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this request' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      request: p2pRequest,
    });
  } catch (error: any) {
    logger.error('P2P request detail error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch request' },
      { status: 500 }
    );
  }
}
