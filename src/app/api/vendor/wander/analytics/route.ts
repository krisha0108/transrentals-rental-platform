// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId)
      return NextResponse.json({ error: auth.error }, { status: 401 });

    const vendorId = auth.vendorId;

    // Listings stats
    const [totalListings, activeListings] = await Promise.all([
      (prisma as any).wander_listings.count({ where: { vendorId } }),
      (prisma as any).wander_listings.count({ where: { vendorId, status: 'ACTIVE' } }),
    ]);

    // Quote requests stats
    const listings = await (prisma as any).wander_listings.findMany({
      where: { vendorId },
      select: { id: true },
    });
    const listingIds = listings.map((l: any) => l.id);

    const [totalQuoteRequests, pendingQuotes, quotedCount] = await Promise.all([
      (prisma as any).wander_quote_requests.count({ where: { wanderListingId: { in: listingIds } } }),
      (prisma as any).wander_quote_requests.count({ where: { wanderListingId: { in: listingIds }, status: 'PENDING' } }),
      (prisma as any).wander_quotes.count({ where: { vendorId } }),
    ]);

    // Booking stats
    const bookings = await (prisma as any).wander_bookings.findMany({
      where: { vendorId },
      select: { id: true, status: true, amount: true, advancePaid: true, createdAt: true },
    });

    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter((b: any) => ['CONFIRMED', 'GUIDE_ASSIGNED', 'STARTED'].includes(b.status)).length;
    const completedBookings = bookings.filter((b: any) => b.status === 'COMPLETED').length;
    const cancelledBookings = bookings.filter((b: any) => b.status === 'CANCELLED').length;

    const totalRevenue = bookings
      .filter((b: any) => ['CONFIRMED', 'GUIDE_ASSIGNED', 'STARTED', 'COMPLETED'].includes(b.status))
      .reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0);

    const conversionRate = totalQuoteRequests > 0
      ? Math.round((totalBookings / totalQuoteRequests) * 100)
      : 0;

    const cancellationRate = totalBookings > 0
      ? Math.round((cancelledBookings / totalBookings) * 100)
      : 0;

    // Reviews stats
    const reviewStats = await (prisma as any).wander_reviews.aggregate({
      where: { listing: { vendorId } },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentBookings = bookings.filter((b: any) =>
      new Date(b.createdAt) >= sixMonthsAgo &&
      ['CONFIRMED', 'GUIDE_ASSIGNED', 'STARTED', 'COMPLETED'].includes(b.status)
    );

    const monthlyRevenue: Record<string, number> = {};
    recentBookings.forEach((b: any) => {
      const d = new Date(b.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + Number(b.amount || 0);
    });

    return NextResponse.json({
      listings: { total: totalListings, active: activeListings },
      quotes: { totalRequests: totalQuoteRequests, pending: pendingQuotes, submitted: quotedCount },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        cancellationRate,
      },
      revenue: { total: totalRevenue, monthly: monthlyRevenue },
      conversion: { rate: conversionRate },
      reviews: {
        avgRating: Math.round((reviewStats._avg.rating || 0) * 10) / 10,
        totalReviews: reviewStats._count.rating,
      },
    });
  } catch (error) {
    console.error('[Vendor Wander Analytics]', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
