// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET — Get vendor's own postings (both vehicle + booking)
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
    const type = searchParams.get('type') || 'all'; // 'vehicle' | 'booking' | 'all'
    const status = searchParams.get('status') || null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let vehiclePostings: any[] = [];
    let bookingPostings: any[] = [];
    let vehicleTotal = 0;
    let bookingTotal = 0;

    const vehicleWhere: any = { vendorId: auth.vendorId };
    const bookingWhere: any = { vendorId: auth.vendorId };
    if (status) {
      vehicleWhere.status = status;
      bookingWhere.status = status;
    }

    const vehicleInclude = {
      vehicleFleet: {
        select: {
          id: true,
          vehicleName: true,
          registrationNumber: true,
          serviceId: true,
        },
      },
      p2p_requests: {
        select: {
          id: true,
          requestNumber: true,
          status: true,
          requestingVendorId: true,
          pickupAddress: true,
          dropAddress: true,
          notes: true,
          requestingVendor: {
            select: {
              id: true,
              businessName: true,
              logo: true,
              city: true,
            },
          },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' as const },
      },
      p2p_transactions: {
        select: {
          id: true,
          transactionNumber: true,
          tripStatus: true,
          paymentStatus: true,
          agreedAmount: true,
          vendorAId: true,
          vendorBId: true,
          vendorA: {
            select: { id: true, businessName: true, logo: true },
          },
          vendorB: {
            select: { id: true, businessName: true, logo: true },
          },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' as const },
      },
    };

    const bookingInclude = {
      p2p_requests: {
        select: {
          id: true,
          requestNumber: true,
          status: true,
          requestingVendorId: true,
          driverName: true,
          driverPhone: true,
          notes: true,
          requestingVendor: {
            select: {
              id: true,
              businessName: true,
              logo: true,
              city: true,
            },
          },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' as const },
      },
      p2p_transactions: {
        select: {
          id: true,
          transactionNumber: true,
          tripStatus: true,
          paymentStatus: true,
          agreedAmount: true,
          vendorAId: true,
          vendorBId: true,
          vendorA: {
            select: { id: true, businessName: true, logo: true },
          },
          vendorB: {
            select: { id: true, businessName: true, logo: true },
          },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' as const },
      },
    };

    // Run all queries in parallel
    if (type === 'all') {
      const [vTotal, vData, bTotal, bData] = await Promise.all([
        prisma.p2p_vehicle_postings.count({ where: vehicleWhere }),
        prisma.p2p_vehicle_postings.findMany({
          where: vehicleWhere,
          include: vehicleInclude,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.p2p_booking_postings.count({ where: bookingWhere }),
        prisma.p2p_booking_postings.findMany({
          where: bookingWhere,
          include: bookingInclude,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);
      vehicleTotal = vTotal;
      vehiclePostings = vData;
      bookingTotal = bTotal;
      bookingPostings = bData;
    } else if (type === 'vehicle') {
      const [vTotal, vData] = await Promise.all([
        prisma.p2p_vehicle_postings.count({ where: vehicleWhere }),
        prisma.p2p_vehicle_postings.findMany({
          where: vehicleWhere,
          include: vehicleInclude,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);
      vehicleTotal = vTotal;
      vehiclePostings = vData;
    } else {
      const [bTotal, bData] = await Promise.all([
        prisma.p2p_booking_postings.count({ where: bookingWhere }),
        prisma.p2p_booking_postings.findMany({
          where: bookingWhere,
          include: bookingInclude,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);
      bookingTotal = bTotal;
      bookingPostings = bData;
    }

    // Add computed counts
    vehiclePostings = vehiclePostings.map((posting) => ({
      ...posting,
      _count: {
        requests: posting.p2p_requests.length,
        transactions: posting.p2p_transactions.length,
      },
      pendingRequests: posting.p2p_requests.filter(
        (r: any) => r.status === 'PENDING'
      ).length,
    }));

    bookingPostings = bookingPostings.map((posting) => ({
      ...posting,
      _count: {
        requests: posting.p2p_requests.length,
        transactions: posting.p2p_transactions.length,
      },
      pendingRequests: posting.p2p_requests.filter(
        (r: any) => r.status === 'PENDING'
      ).length,
    }));

    logger.info('P2P my-postings fetched', {
      vendorId: auth.vendorId,
      type,
      vehicleCount: vehiclePostings.length,
      bookingCount: bookingPostings.length,
    });

    return NextResponse.json({
      success: true,
      vehiclePostings,
      bookingPostings,
      totals: {
        vehicles: vehicleTotal,
        bookings: bookingTotal,
      },
      pagination: {
        page,
        limit,
        type,
      },
    });
  } catch (error: any) {
    logger.error('P2P my-postings GET error', error);
    return NextResponse.json(
      { error: 'Failed to fetch postings' },
      { status: 500 }
    );
  }
}
