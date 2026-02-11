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

    // Get conversion funnel
    const funnelSteps = [
      'PAGE_VISIT',
      'SEARCH',
      'QUOTE_VIEW',
      'QUOTE_REQUEST',
      'BOOKING_INITIATED',
      'BOOKING_COMPLETED',
    ];

    const funnelData = await Promise.all(
      funnelSteps.map(async (step, index) => {
        const count = await prisma.conversion_events.count({
          where: {
            eventType: step as any,
            timestamp: { gte: startDate },
          },
        });

        return {
          step,
          stepOrder: index + 1,
          visitors: count,
          conversionRate: 0, // Will calculate below
        };
      })
    );

    // Calculate conversion rates
    for (let i = 1; i < funnelData.length; i++) {
      if (funnelData[i - 1].visitors > 0) {
        funnelData[i].conversionRate =
          (funnelData[i].visitors / funnelData[i - 1].visitors) * 100;
      }
    }

    // Get traffic sources performance
    const sourcePerformance = await prisma.conversion_events.groupBy({
      by: ['source'],
      where: {
        timestamp: { gte: startDate },
        source: { not: null },
      },
      _count: true,
    });

    const sourceWithConversions = await Promise.all(
      sourcePerformance.map(async (source) => {
        const conversions = await prisma.conversion_events.count({
          where: {
            source: source.source,
            eventType: 'BOOKING_COMPLETED',
            timestamp: { gte: startDate },
          },
        });

        const revenue = await prisma.conversion_events.aggregate({
          where: {
            source: source.source,
            eventType: 'BOOKING_COMPLETED',
            timestamp: { gte: startDate },
          },
          _sum: {
            bookingValue: true,
          },
        });

        return {
          source: source.source || 'direct',
          visits: source._count,
          conversions,
          conversionRate: (conversions / source._count) * 100,
          revenue: revenue._sum.bookingValue || 0,
        };
      })
    );

    // Get top pages by traffic
    const topPages = await prisma.conversion_events.groupBy({
      by: ['pagePath'],
      where: {
        eventType: 'PAGE_VISIT',
        timestamp: { gte: startDate },
      },
      _count: true,
      orderBy: {
        _count: {
          pagePath: 'desc',
        },
      },
      take: 10,
    });

    const topPagesWithConversions = await Promise.all(
      topPages.map(async (page) => {
        const conversions = await prisma.conversion_events.count({
          where: {
            pagePath: page.pagePath,
            eventType: 'BOOKING_COMPLETED',
            timestamp: { gte: startDate },
          },
        });

        return {
          page: page.pagePath,
          visits: page._count,
          conversions,
          conversionRate: page._count > 0 ? (conversions / page._count) * 100 : 0,
        };
      })
    );

    // Get daily trend
    const dailyTrend = await prisma.$queryRaw<
      Array<{ date: Date; visits: number; conversions: number }>
    >`
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as visits,
        SUM(CASE WHEN eventType = 'BOOKING_COMPLETED' THEN 1 ELSE 0 END) as conversions
      FROM conversion_events
      WHERE timestamp >= ${startDate}
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `;

    // Get device performance
    const devicePerformance = await prisma.conversion_events.groupBy({
      by: ['device'],
      where: {
        timestamp: { gte: startDate },
        device: { not: null },
      },
      _count: true,
    });

    const deviceWithConversions = await Promise.all(
      devicePerformance.map(async (device) => {
        const conversions = await prisma.conversion_events.count({
          where: {
            device: device.device,
            eventType: 'BOOKING_COMPLETED',
            timestamp: { gte: startDate },
          },
        });

        return {
          device: device.device || 'unknown',
          visits: device._count,
          conversions,
          conversionRate: (conversions / device._count) * 100,
        };
      })
    );

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
