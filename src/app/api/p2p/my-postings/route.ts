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

    // Build common where clause for vehicle postings
    if (type === 'vehicle' || type === 'all') {
      const vehicleWhere: any = { vendorId: auth.vendorId };
      if (status) {
        vehicleWhere.status = status;
      }

      // Get total count
      vehicleTotal = await prisma.p2p_vehicle_postings.count({
        where: vehicleWhere,
      });

      // Fetch vehicle postings with request count and transaction info
      vehiclePostings = await prisma.p2p_vehicle_postings.findMany({
        where: vehicleWhere,
        include: {
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
            orderBy: { createdAt: 'desc' },
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
                select: {
                  id: true,
                  businessName: true,
                  logo: true,
                },
              },
              vendorB: {
                select: {
                  id: true,
                  businessName: true,
                  logo: true,
                },
              },
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: type === 'vehicle' ? skip : 0,
        take: type === 'vehicle' ? limit : undefined,
      });

      // Add computed request count to each posting
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
    }

    // Build common where clause for booking postings
    if (type === 'booking' || type === 'all') {
      const bookingWhere: any = { vendorId: auth.vendorId };
      if (status) {
        bookingWhere.status = status;
      }

      // Get total count
      bookingTotal = await prisma.p2p_booking_postings.count({
        where: bookingWhere,
      });

      // Fetch booking postings with request count and transaction info
      bookingPostings = await prisma.p2p_booking_postings.findMany({
        where: bookingWhere,
        include: {
          p2p_requests: {
            select: {
              id: true,
              requestNumber: true,
              status: true,
              requestingVendorId: true,
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
            orderBy: { createdAt: 'desc' },
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
                select: {
                  id: true,
                  businessName: true,
                  logo: true,
                },
              },
              vendorB: {
                select: {
                  id: true,
                  businessName: true,
                  logo: true,
                },
              },
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: type === 'booking' ? skip : 0,
        take: type === 'booking' ? limit : undefined,
      });

      // Add computed request count to each posting
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
    }

    // If type is 'all', apply pagination to the combined result
    if (type === 'all') {
      vehiclePostings = vehiclePostings.slice(skip, skip + limit);
      bookingPostings = bookingPostings.slice(skip, skip + limit);
    }

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
