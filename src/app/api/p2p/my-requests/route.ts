// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET — Get all P2P requests sent by the authenticated vendor (as requestingVendor)
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { requestingVendorId: auth.vendorId };
    if (status) {
      where.status = status;
    }

    // Get total count for pagination
    const total = await prisma.p2p_requests.count({ where });

    // Fetch requests sent by this vendor
    const requests = await prisma.p2p_requests.findMany({
      where,
      include: {
        postingVendor: {
          select: {
            id: true,
            businessName: true,
            logo: true,
            city: true,
            phone: true,
          },
        },
        vehiclePosting: {
          select: {
            id: true,
            postingNumber: true,
            serviceType: true,
            vehicleName: true,
            vehicleNumber: true,
            fromCity: true,
            toCity: true,
            departureDate: true,
            priceFullLoad: true,
            status: true,
          },
        },
        bookingPosting: {
          select: {
            id: true,
            postingNumber: true,
            serviceType: true,
            vehicleRequired: true,
            fromCity: true,
            toCity: true,
            tripDate: true,
            customerBudget: true,
            partnerEarning: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    logger.info('P2P my-requests fetched', {
      vendorId: auth.vendorId,
      status,
      count: requests.length,
      total,
    });

    return NextResponse.json({
      success: true,
      requests,
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    logger.error('P2P my-requests GET error', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}
