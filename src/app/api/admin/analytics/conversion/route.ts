import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

/**
 * Get conversion analytics data
 * GET /api/admin/analytics/conversion
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || '7';
    const daysAgo = parseInt(dateRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get total conversions by type
    const conversionsByType = await prisma.conversion_events.groupBy({
      by: ['eventType'],
      where: {
        timestamp: { gte: startDate },
      },
      _count: true,
    });

    // Get total bookings and revenue
    const bookings = await prisma.conversion_events.findMany({
      where: {
        eventType: 'BOOKING_COMPLETED',
        timestamp: { gte: startDate },
      },
      select: {
        bookingValue: true,
        bookingType: true,
        timestamp: true,
      },
    });

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.bookingValue || 0), 0);

    // Get bookings by type
    const bookingsByType = bookings.reduce((acc, b) => {
      const type = b.bookingType || 'unknown';
      if (!acc[type]) {
        acc[type] = { count: 0, revenue: 0 };
      }
      acc[type].count++;
      acc[type].revenue += b.bookingValue || 0;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    // Get conversion funnel — single groupBy instead of 6 separate count queries
    const funnelSteps = [
      'PAGE_VISIT',
      'SEARCH',
      'QUOTE_VIEW',
      'QUOTE_REQUEST',
      'BOOKING_INITIATED',
      'BOOKING_COMPLETED',
    ];

    const funnelCounts = await prisma.conversion_events.groupBy({
      by: ['eventType'],
      where: {
        eventType: { in: funnelSteps as any[] },
        timestamp: { gte: startDate },
      },
      _count: true,
    });

    const funnelCountMap = Object.fromEntries(funnelCounts.map(f => [f.eventType, f._count]));
    const funnelData = funnelSteps.map((step, index) => ({
      step,
      stepOrder: index + 1,
      visitors: funnelCountMap[step] || 0,
      conversionRate: 0,
    }));
    for (let i = 1; i < funnelData.length; i++) {
      if (funnelData[i - 1].visitors > 0) {
        funnelData[i].conversionRate = (funnelData[i].visitors / funnelData[i - 1].visitors) * 100;
      }
    }

    // Fetch all BOOKING_COMPLETED events once — use in JS for source/page/device breakdown
    const [allCompletedBookings, sourcePerformance, topPages, devicePerformance, dailyTrend] = await Promise.all([
      prisma.conversion_events.findMany({
        where: { eventType: 'BOOKING_COMPLETED', timestamp: { gte: startDate } },
        select: { source: true, pagePath: true, device: true, bookingValue: true },
      }),
      prisma.conversion_events.groupBy({
        by: ['source'],
        where: { timestamp: { gte: startDate }, source: { not: null } },
        _count: true,
      }),
      prisma.conversion_events.groupBy({
        by: ['pagePath'],
        where: { eventType: 'PAGE_VISIT', timestamp: { gte: startDate } },
        _count: true,
        orderBy: { _count: { pagePath: 'desc' } },
        take: 10,
      }),
      prisma.conversion_events.groupBy({
        by: ['device'],
        where: { timestamp: { gte: startDate }, device: { not: null } },
        _count: true,
      }),
      prisma.$queryRaw<Array<{ date: Date; visits: number; conversions: number }>>`
        SELECT
          DATE(timestamp) as date,
          COUNT(*) as visits,
          SUM(CASE WHEN eventType = 'BOOKING_COMPLETED' THEN 1 ELSE 0 END) as conversions
        FROM conversion_events
        WHERE timestamp >= ${startDate}
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      `,
    ]);

    // Aggregate completed bookings by source, page, device in JS (no extra queries)
    const completedBySource: Record<string, { count: number; revenue: number }> = {};
    const completedByPage: Record<string, number> = {};
    const completedByDevice: Record<string, number> = {};
    allCompletedBookings.forEach(b => {
      const src = b.source || 'direct';
      if (!completedBySource[src]) completedBySource[src] = { count: 0, revenue: 0 };
      completedBySource[src].count++;
      completedBySource[src].revenue += b.bookingValue || 0;
      if (b.pagePath) completedByPage[b.pagePath] = (completedByPage[b.pagePath] || 0) + 1;
      if (b.device) completedByDevice[b.device] = (completedByDevice[b.device] || 0) + 1;
    });

    const sourceWithConversions = sourcePerformance.map(s => {
      const src = s.source || 'direct';
      const completed = completedBySource[src] || { count: 0, revenue: 0 };
      return {
        source: src,
        visits: s._count,
        conversions: completed.count,
        conversionRate: s._count > 0 ? (completed.count / s._count) * 100 : 0,
        revenue: completed.revenue,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const topPagesWithConversions = topPages.map(p => {
      const conversions = completedByPage[p.pagePath || ''] || 0;
      return {
        page: p.pagePath,
        visits: p._count,
        conversions,
        conversionRate: p._count > 0 ? (conversions / p._count) * 100 : 0,
      };
    });

    const deviceWithConversions = devicePerformance.map(d => {
      const conversions = completedByDevice[d.device || ''] || 0;
      return {
        device: d.device || 'unknown',
        visits: d._count,
        conversions,
        conversionRate: d._count > 0 ? (conversions / d._count) * 100 : 0,
      };
    });

    return NextResponse.json({
      summary: {
        totalVisits: funnelData[0]?.visitors || 0,
        totalBookings,
        totalRevenue,
        avgOrderValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
        overallConversionRate:
          funnelData[0]?.visitors > 0
            ? (totalBookings / funnelData[0].visitors) * 100
            : 0,
      },
      conversionsByType: conversionsByType.map((c) => ({
        type: c.eventType,
        count: c._count,
      })),
      bookingsByType,
      funnel: funnelData,
      sourcePerformance: sourceWithConversions.sort((a, b) => b.revenue - a.revenue),
      topPages: topPagesWithConversions,
      dailyTrend: dailyTrend.map((d) => ({
        date: d.date,
        visits: Number(d.visits),
        conversions: Number(d.conversions),
        conversionRate:
          Number(d.visits) > 0 ? (Number(d.conversions) / Number(d.visits)) * 100 : 0,
      })),
      devicePerformance: deviceWithConversions,
    });
  } catch (error) {
    console.error('[Analytics Conversion] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversion analytics' },
      { status: 500 }
    );
  }
}
