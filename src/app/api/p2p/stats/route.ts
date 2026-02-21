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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendorId = auth.vendorId;

    const [
      totalVehiclePostings,
      totalBookingPostings,
      activeVehiclePostings,
      activeBookingPostings,
      totalTransactions,
      completedTransactions,
      earningsAsVendorA,
      earningsAsVendorB,
      pendingSettlements,
      ratingsAggregate,
      totalRatings,
      recentActivity,
    ] = await Promise.all([
      // Total vehicle postings by this vendor
      prisma.p2p_vehicle_postings.count({
        where: { vendorId },
      }).catch(() => 0),

      // Total booking postings by this vendor
      prisma.p2p_booking_postings.count({
        where: { vendorId },
      }).catch(() => 0),

      // Active vehicle postings
      prisma.p2p_vehicle_postings.count({
        where: { vendorId, status: 'ACTIVE' },
      }).catch(() => 0),

      // Active booking postings
      prisma.p2p_booking_postings.count({
        where: { vendorId, status: 'ACTIVE' },
      }).catch(() => 0),

      // Total transactions where vendor is vendorA or vendorB
      prisma.p2p_transactions.count({
        where: {
          OR: [
            { vendorAId: vendorId },
            { vendorBId: vendorId },
          ],
        },
      }).catch(() => 0),

      // Completed transactions
      prisma.p2p_transactions.count({
        where: {
          OR: [
            { vendorAId: vendorId },
            { vendorBId: vendorId },
          ],
          tripStatus: 'COMPLETED',
        },
      }).catch(() => 0),

      // Earnings as vendorA (sum of vendorAEarning for COMPLETED/SETTLED)
      prisma.p2p_transactions.aggregate({
        where: {
          vendorAId: vendorId,
          tripStatus: { in: ['COMPLETED', 'SETTLED'] },
        },
        _sum: {
          vendorAEarning: true,
        },
      }).catch(() => ({ _sum: { vendorAEarning: null } })),

      // Earnings as vendorB (sum of vendorBEarning for COMPLETED/SETTLED)
      prisma.p2p_transactions.aggregate({
        where: {
          vendorBId: vendorId,
          tripStatus: { in: ['COMPLETED', 'SETTLED'] },
        },
        _sum: {
          vendorBEarning: true,
        },
      }).catch(() => ({ _sum: { vendorBEarning: null } })),

      // Pending settlements (payment PENDING and trip COMPLETED)
      prisma.p2p_transactions.count({
        where: {
          OR: [
            { vendorAId: vendorId },
            { vendorBId: vendorId },
          ],
          paymentStatus: 'PENDING',
          tripStatus: { in: ['COMPLETED'] },
        },
      }).catch(() => 0),

      // Average rating received
      prisma.p2p_ratings.aggregate({
        where: { ratedVendorId: vendorId },
        _avg: {
          overallRating: true,
        },
      }).catch(() => ({ _avg: { overallRating: null } })),

      // Total ratings received
      prisma.p2p_ratings.count({
        where: { ratedVendorId: vendorId },
      }).catch(() => 0),

      // Recent activity - last 5 transactions
      prisma.p2p_transactions.findMany({
        where: {
          OR: [
            { vendorAId: vendorId },
            { vendorBId: vendorId },
          ],
        },
        select: {
          id: true,
          transactionNumber: true,
          postingType: true,
          serviceType: true,
          fromCity: true,
          toCity: true,
          tripDate: true,
          agreedAmount: true,
          tripStatus: true,
          paymentStatus: true,
          vendorAId: true,
          vendorBId: true,
          createdAt: true,
          vendorA: { select: { id: true, businessName: true, logo: true } },
          vendorB: { select: { id: true, businessName: true, logo: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }).catch(() => []),
    ]);

    const totalEarnings =
      (earningsAsVendorA._sum.vendorAEarning || 0) +
      (earningsAsVendorB._sum.vendorBEarning || 0);

    const activePostings = activeVehiclePostings + activeBookingPostings;

    const averageRating = ratingsAggregate._avg.overallRating
      ? Math.round(ratingsAggregate._avg.overallRating * 10) / 10
      : 0;

    logger.info('P2P stats fetched', {
      vendorId,
      totalVehiclePostings,
      totalBookingPostings,
      totalTransactions,
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalVehiclePostings,
        totalBookingPostings,
        activePostings,
        totalTransactions,
        completedTransactions,
        totalEarnings,
        pendingSettlements,
        averageRating,
        totalRatings,
        recentActivity,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch P2P stats', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Failed to fetch P2P stats' },
      { status: 500 }
    );
  }
}
