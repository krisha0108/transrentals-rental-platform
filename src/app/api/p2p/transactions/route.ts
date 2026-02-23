// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      OR: [
        { vendorAId: auth.vendorId },
        { vendorBId: auth.vendorId },
      ],
    };

    // Filter by tripStatus if provided
    if (status) {
      where.tripStatus = status;
    }

    // Filter by postingType if provided (VEHICLE or BOOKING)
    if (type) {
      where.postingType = type;
    }

    // Get total count and transactions in parallel
    const [total, transactions] = await Promise.all([
      prisma.p2p_transactions.count({ where }),
      prisma.p2p_transactions.findMany({
        where,
        include: {
          vendorA: {
            select: {
              id: true,
              businessName: true,
              city: true,
              logo: true,
            },
          },
          vendorB: {
            select: {
              id: true,
              businessName: true,
              city: true,
              logo: true,
            },
          },
          vehiclePosting: {
            select: {
              id: true,
              postingNumber: true,
              vehicleName: true,
              vehicleNumber: true,
              fromCity: true,
              toCity: true,
              departureDate: true,
              serviceType: true,
              status: true,
            },
          },
          bookingPosting: {
            select: {
              id: true,
              postingNumber: true,
              serviceType: true,
              bookingType: true,
              fromCity: true,
              toCity: true,
              tripDate: true,
              customerBudget: true,
              status: true,
            },
          },
          p2p_ratings: {
            select: {
              id: true,
              raterVendorId: true,
              overallRating: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    logger.info('P2P transactions listed', {
      vendorId: auth.vendorId,
      page,
      limit,
      total,
      filters: { status, type },
    });

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error('Failed to list P2P transactions', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
