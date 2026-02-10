import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

/**
 * Real-Time Analytics API
 * GET /api/analytics/realtime?type=visitors|events|performance
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const response: any = {};

    // Active visitors (last 30 minutes)
    if (type === 'visitors' || type === 'all') {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

      const activeVisitors = await prisma.page_views.groupBy({
        by: ['sessionId'],
        where: {
          viewedAt: {
            gte: thirtyMinutesAgo,
          },
          sessionId: {
            not: null,
          },
        },
        _count: {
          sessionId: true,
        },
      });

      // Get visitor details
      const visitorDetails = await prisma.page_views.findMany({
        where: {
          viewedAt: {
            gte: thirtyMinutesAgo,
          },
          sessionId: {
            not: null,
          },
        },
        select: {
          sessionId: true,
          path: true,
          title: true,
          device: true,
          browser: true,
          os: true,
          country: true,
          city: true,
          viewedAt: true,
        },
        orderBy: {
          viewedAt: 'desc',
        },
        distinct: ['sessionId'],
      });

      // Group by location
      const locationGroups = visitorDetails.reduce((acc: any, visitor) => {
        const location = `${visitor.city || 'Unknown'}, ${visitor.country || 'Unknown'}`;
        if (!acc[location]) {
          acc[location] = {
            location,
            count: 0,
            country: visitor.country,
            city: visitor.city,
          };
        }
        acc[location].count++;
        return acc;
      }, {});

      response.activeVisitors = {
        total: activeVisitors.length,
        byLocation: Object.values(locationGroups),
        recentVisitors: visitorDetails.slice(0, 10).map((v) => ({
          sessionId: v.sessionId,
          currentPage: v.path,
          pageTitle: v.title,
          device: v.device,
          location: `${v.city || 'Unknown'}, ${v.country || 'Unknown'}`,
          lastActive: v.viewedAt,
        })),
      };
    }

    // Recent events (last hour)
    if (type === 'events' || type === 'all') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const recentEvents = await prisma.conversion_events.findMany({
        where: {
          timestamp: {
            gte: oneHourAgo,
          },
        },
        select: {
          id: true,
          eventType: true,
          sessionId: true,
          pagePath: true,
          pageTitle: true,
          source: true,
          medium: true,
          device: true,
          country: true,
          city: true,
          bookingType: true,
          bookingValue: true,
          timestamp: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 50,
      });

      // Event type breakdown
      const eventTypeBreakdown = recentEvents.reduce((acc: any, event) => {
        const type = event.eventType || 'UNKNOWN';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      response.recentEvents = {
        total: recentEvents.length,
        events: recentEvents.map((e) => ({
          id: e.id,
          type: e.eventType,
          page: e.pagePath,
          title: e.pageTitle,
          location: `${e.city || 'Unknown'}, ${e.country || 'Unknown'}`,
          device: e.device,
          source: e.source,
          bookingType: e.bookingType,
          bookingValue: e.bookingValue,
          timestamp: e.timestamp,
        })),
        breakdown: eventTypeBreakdown,
      };
    }

    // Performance metrics (last 24 hours)
    if (type === 'performance' || type === 'all') {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Get average page load times (stored in page_views)
      const performanceData = await prisma.page_views.findMany({
        where: {
          viewedAt: {
            gte: oneDayAgo,
          },
        },
        select: {
          path: true,
          viewedAt: true,
        },
      });

      // Calculate metrics
      const pageGroups = performanceData.reduce((acc: any, view) => {
        if (!acc[view.path]) {
          acc[view.path] = { views: 0, path: view.path };
        }
        acc[view.path].views++;
        return acc;
      }, {});

      const topPages = Object.values(pageGroups)
        .sort((a: any, b: any) => b.views - a.views)
        .slice(0, 10);

      response.performance = {
        totalPageViews: performanceData.length,
        topPages,
        period: 'Last 24 hours',
      };
    }

    // Current stats (last 5 minutes)
    if (type === 'current' || type === 'all') {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const [recentPageViews, recentEvents] = await Promise.all([
        prisma.page_views.count({
          where: {
            viewedAt: {
              gte: fiveMinutesAgo,
            },
          },
        }),
        prisma.conversion_events.count({
          where: {
            timestamp: {
              gte: fiveMinutesAgo,
            },
          },
        }),
      ]);

      response.current = {
        pageViewsLast5Min: recentPageViews,
        eventsLast5Min: recentEvents,
        timestamp: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Real-Time Analytics API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real-time analytics' },
      { status: 500 }
    );
  }
}
