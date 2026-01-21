// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get vendor bus earnings summary and transactions
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'this-month';

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    if (period === 'this-month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'last-month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (period === 'last-3-months') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    } else {
      // All time
      startDate = new Date(2020, 0, 1);
    }

    // Get completed bookings for the period
    const completedBookings = await prisma.bus_bookings.findMany({
      where: {
        vendorId: vendorId,
        status: 'COMPLETED',
        tripEndedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { tripEndedAt: 'desc' },
      take: 50,
    });

    // Calculate this month earnings
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthBookings = await prisma.bus_bookings.aggregate({
      where: {
        vendorId: vendorId,
        status: 'COMPLETED',
        tripEndedAt: {
          gte: thisMonthStart,
        },
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    // Calculate last month earnings
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthBookings = await prisma.bus_bookings.aggregate({
      where: {
        vendorId: vendorId,
        status: 'COMPLETED',
        tripEndedAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    // Calculate total earnings
    const totalBookings = await prisma.bus_bookings.aggregate({
      where: {
        vendorId: vendorId,
        status: 'COMPLETED',
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    // Calculate pending payouts (confirmed but not paid out yet)
    const pendingPayouts = await prisma.bus_bookings.aggregate({
      where: {
        vendorId: vendorId,
        status: 'COMPLETED',
        // Assuming we have a payoutStatus field or similar
        // For now, use tripEndedAt within last 7 days as "pending"
        tripEndedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      _sum: { totalAmount: true },
    });

    const thisMonth = thisMonthBookings._sum.totalAmount || 0;
    const lastMonth = lastMonthBookings._sum.totalAmount || 0;
    const totalEarnings = totalBookings._sum.totalAmount || 0;
    const completedTrips = totalBookings._count || 0;
    const pendingPayout = pendingPayouts._sum.totalAmount || 0;

    // Platform commission (10%)
    const commissionRate = 0.10;

    // Transform bookings to transactions
    const transactions = completedBookings.map((booking) => {
      const commission = Math.round(booking.totalAmount * commissionRate);
      return {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        vehicleName: booking.vehicleName || booking.vehicle_category,
        customerName: booking.customerName,
        tripType: booking.tripType,
        route: `${booking.pickupCity}${booking.dropCity ? ` - ${booking.dropCity}` : ''}`,
        amount: booking.totalAmount,
        commission,
        netAmount: booking.totalAmount - commission,
        status: 'completed' as const,
        date: booking.tripEndedAt?.toISOString() || booking.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalEarnings: Math.round(totalEarnings * (1 - commissionRate)),
        thisMonth: Math.round(thisMonth * (1 - commissionRate)),
        lastMonth: Math.round(lastMonth * (1 - commissionRate)),
        pendingPayout: Math.round(pendingPayout * (1 - commissionRate)),
        completedTrips,
        averagePerTrip: completedTrips > 0 ? Math.round((totalEarnings * (1 - commissionRate)) / completedTrips) : 0,
      },
      transactions,
    });
  } catch (error: any) {
    logger.error('Failed to fetch vendor bus earnings', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings', details: error?.message },
      { status: 500 }
    );
  }
}
