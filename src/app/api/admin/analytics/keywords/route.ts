import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

/**
 * Get keyword performance analytics
 * GET /api/admin/analytics/keywords
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || '30';
    const sortBy = searchParams.get('sortBy') || 'conversions'; // conversions, revenue, clicks
    const daysAgo = parseInt(dateRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get keyword performance data
    const keywords = await prisma.keyword_performance.findMany({
      where: {
        date: { gte: startDate },
      },
      orderBy:
        sortBy === 'revenue'
          ? { revenue: 'desc' }
          : sortBy === 'clicks'
          ? { clicks: 'desc' }
          : { conversions: 'desc' },
    });

    // Aggregate by keyword (sum across dates)
    const keywordMap = new Map<string, {
      keyword: string;
      impressions: number;
      clicks: number;
      visitors: number;
      conversions: number;
      revenue: number;
      avgPosition: number;
      topPage: string | null;
      avgTimeOnSite: number;
      bounceRate: number;
      pagesPerSession: number;
      ctr: number;
      conversionRate: number;
      revenuePerClick: number;
    }>();

    keywords.forEach((kw) => {
      const existing = keywordMap.get(kw.keyword) || {
        keyword: kw.keyword,
        impressions: 0,
        clicks: 0,
        visitors: 0,
        conversions: 0,
        revenue: 0,
        avgPosition: 0,
        topPage: kw.topPage,
        avgTimeOnSite: 0,
        bounceRate: 0,
        pagesPerSession: 0,
        ctr: 0,
        conversionRate: 0,
        revenuePerClick: 0,
      };

      existing.impressions += kw.impressions;
      existing.clicks += kw.clicks;
      existing.visitors += kw.visitors;
      existing.conversions += kw.conversions;
      existing.revenue += kw.revenue || 0;
      existing.avgPosition = kw.avgPosition || 0;
      existing.avgTimeOnSite = kw.avgTimeOnSite || 0;
      existing.bounceRate = kw.bounceRate || 0;
      existing.pagesPerSession = kw.pagesPerSession || 0;

      keywordMap.set(kw.keyword, existing);
    });

    // Calculate metrics
    const keywordStats = Array.from(keywordMap.values()).map((kw) => ({
      ...kw,
      ctr: kw.impressions > 0 ? (kw.clicks / kw.impressions) * 100 : 0,
      conversionRate: kw.clicks > 0 ? (kw.conversions / kw.clicks) * 100 : 0,
      revenuePerClick: kw.clicks > 0 ? kw.revenue / kw.clicks : 0,
    }));

    // Sort by selected metric
    keywordStats.sort((a, b) => {
      if (sortBy === 'revenue') return b.revenue - a.revenue;
      if (sortBy === 'clicks') return b.clicks - a.clicks;
      return b.conversions - a.conversions;
    });

    // Get top 20 keywords
    const topKeywords = keywordStats.slice(0, 20);

    // Get keyword trends (daily)
    const keywordTrends = await Promise.all(
      topKeywords.slice(0, 5).map(async (kw) => {
        const trend = await prisma.keyword_performance.findMany({
          where: {
            keyword: kw.keyword,
            date: { gte: startDate },
          },
          orderBy: { date: 'asc' },
        });

        return {
          keyword: kw.keyword,
          trend: trend.map((t) => ({
            date: t.date,
            clicks: t.clicks,
            conversions: t.conversions,
            revenue: t.revenue || 0,
          })),
        };
      })
    );

    // Calculate summary stats
    const totalImpressions = keywordStats.reduce((sum, k) => sum + k.impressions, 0);
    const totalClicks = keywordStats.reduce((sum, k) => sum + k.clicks, 0);
    const totalConversions = keywordStats.reduce((sum, k) => sum + k.conversions, 0);
    const totalRevenue = keywordStats.reduce((sum, k) => sum + k.revenue, 0);

    // Get keyword by booking type
    const keywordsByBookingType = await prisma.conversion_events.groupBy({
      by: ['keyword', 'bookingType'],
      where: {
        keyword: { not: null },
        bookingType: { not: null },
        eventType: 'BOOKING_COMPLETED',
        timestamp: { gte: startDate },
      },
      _count: true,
      _sum: {
        bookingValue: true,
      },
    });

    const bookingTypeMap = new Map<string, Array<{
      keyword: string;
      count: number;
      revenue: number;
    }>>();

    keywordsByBookingType.forEach((item) => {
      if (!item.keyword || !item.bookingType) return;

      const bookings = bookingTypeMap.get(item.bookingType) || [];
      bookings.push({
        keyword: item.keyword,
        count: item._count,
        revenue: item._sum.bookingValue || 0,
      });
      bookingTypeMap.set(item.bookingType, bookings);
    });

    // Sort each booking type by revenue
    bookingTypeMap.forEach((bookings, type) => {
      bookings.sort((a, b) => b.revenue - a.revenue);
      bookingTypeMap.set(type, bookings.slice(0, 10)); // Top 10 per type
    });

    return NextResponse.json({
      summary: {
        totalKeywords: keywordStats.length,
        totalImpressions,
        totalClicks,
        totalConversions,
        totalRevenue,
        avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        avgConversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        avgRevenuePerClick: totalClicks > 0 ? totalRevenue / totalClicks : 0,
      },
      topKeywords,
      keywordTrends,
      keywordsByBookingType: Object.fromEntries(bookingTypeMap),
    });
  } catch (error) {
    console.error('[Analytics Keywords] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch keyword analytics' },
      { status: 500 }
    );
  }
}
