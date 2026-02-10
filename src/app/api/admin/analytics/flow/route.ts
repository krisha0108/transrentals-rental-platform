import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export const dynamic = 'force-dynamic';

/**
 * Get user flow analytics (page-to-page navigation)
 * GET /api/admin/analytics/flow
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
    const minFlows = parseInt(searchParams.get('minFlows') || '5'); // Minimum flows to show
    const daysAgo = parseInt(dateRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get all flows
    const flows = await prisma.user_flow.groupBy({
      by: ['fromPage', 'toPage'],
      where: {
        timestamp: { gte: startDate },
      },
      _count: true,
      _avg: {
        timeOnPage: true,
      },
    });

    // Filter flows with minimum count
    const significantFlows = flows
      .filter((f) => f._count >= minFlows)
      .map((f) => ({
        from: f.fromPage,
        to: f.toPage,
        count: f._count,
        avgTimeOnPage: Math.round(f._avg.timeOnPage || 0),
      }))
      .sort((a, b) => b.count - a.count);

    // Get top entry pages
    const entryPages = await prisma.conversion_events.groupBy({
      by: ['pagePath'],
      where: {
        eventType: 'PAGE_VISIT',
        landingPage: { not: null },
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

    // Get top exit pages (pages with no subsequent flow)
    const exitPages = await prisma.$queryRaw<
      Array<{ page: string; exits: number }>
    >`
      SELECT
        uf.fromPage as page,
        COUNT(*) as exits
      FROM user_flow uf
      LEFT JOIN user_flow uf2 ON uf.toPage = uf2.fromPage
        AND uf.sessionId = uf2.sessionId
        AND uf2.timestamp > uf.timestamp
      WHERE uf.timestamp >= ${startDate}
        AND uf2.id IS NULL
      GROUP BY uf.fromPage
      ORDER BY exits DESC
      LIMIT 10
    `;

    // Get conversion paths (sessions that led to booking)
    const conversionPaths = await prisma.$queryRaw<
      Array<{
        sessionId: string;
        path: string;
        bookingType: string;
        revenue: number;
      }>
    >`
      SELECT
        ce.sessionId,
        GROUP_CONCAT(DISTINCT ce.pagePath ORDER BY ce.timestamp SEPARATOR ' → ') as path,
        ce.bookingType,
        MAX(ce.bookingValue) as revenue
      FROM conversion_events ce
      WHERE ce.sessionId IN (
        SELECT DISTINCT sessionId
        FROM conversion_events
        WHERE eventType = 'BOOKING_COMPLETED'
          AND timestamp >= ${startDate}
      )
      GROUP BY ce.sessionId, ce.bookingType
      ORDER BY revenue DESC
      LIMIT 20
    `;

    // Get drop-off points (pages with high exit rate)
    const dropoffPoints = await prisma.$queryRaw<
      Array<{
        page: string;
        totalVisits: number;
        exits: number;
        exitRate: number;
      }>
    >`
      SELECT
        fromPage as page,
        COUNT(*) as totalVisits,
        SUM(CASE WHEN next_flow IS NULL THEN 1 ELSE 0 END) as exits,
        (SUM(CASE WHEN next_flow IS NULL THEN 1 ELSE 0 END) / COUNT(*)) * 100 as exitRate
      FROM (
        SELECT
          uf1.fromPage,
          uf2.id as next_flow
        FROM user_flow uf1
        LEFT JOIN user_flow uf2 ON uf1.toPage = uf2.fromPage
          AND uf1.sessionId = uf2.sessionId
          AND uf2.timestamp > uf1.timestamp
        WHERE uf1.timestamp >= ${startDate}
      ) AS flows
      GROUP BY fromPage
      HAVING totalVisits >= 10
      ORDER BY exitRate DESC
      LIMIT 10
    `;

    // Get device-specific flow patterns
    const deviceFlows = await prisma.user_flow.groupBy({
      by: ['device', 'fromPage', 'toPage'],
      where: {
        timestamp: { gte: startDate },
        device: { not: null },
      },
      _count: true,
    });

    const deviceFlowMap = new Map<string, Array<{
      from: string;
      to: string;
      count: number;
    }>>();

    deviceFlows.forEach((flow) => {
      if (!flow.device) return;

      const flows = deviceFlowMap.get(flow.device) || [];
      flows.push({
        from: flow.fromPage,
        to: flow.toPage,
        count: flow._count,
      });
      deviceFlowMap.set(flow.device, flows);
    });

    // Sort and limit device flows
    deviceFlowMap.forEach((flows, device) => {
      flows.sort((a, b) => b.count - a.count);
      deviceFlowMap.set(device, flows.slice(0, 20));
    });

    // Calculate path depth statistics
    const pathDepths = await prisma.$queryRaw<
      Array<{ depth: number; sessions: number }>
    >`
      SELECT
        pathDepth as depth,
        COUNT(*) as sessions
      FROM (
        SELECT
          sessionId,
          COUNT(*) as pathDepth
        FROM user_flow
        WHERE timestamp >= ${startDate}
        GROUP BY sessionId
      ) AS depths
      GROUP BY pathDepth
      ORDER BY pathDepth ASC
    `;

    return NextResponse.json({
      flows: significantFlows.slice(0, 100), // Top 100 flows for Sankey diagram
      entryPages: entryPages.map((e) => ({
        page: e.pagePath,
        count: e._count,
      })),
      exitPages: exitPages.map((e) => ({
        page: e.page,
        count: Number(e.exits),
      })),
      conversionPaths: conversionPaths.map((p) => ({
        sessionId: p.sessionId,
        path: p.path,
        bookingType: p.bookingType,
        revenue: Number(p.revenue || 0),
      })),
      dropoffPoints: dropoffPoints.map((d) => ({
        page: d.page,
        totalVisits: Number(d.totalVisits),
        exits: Number(d.exits),
        exitRate: Number(d.exitRate),
      })),
      deviceFlows: Object.fromEntries(deviceFlowMap),
      pathDepths: pathDepths.map((p) => ({
        depth: Number(p.depth),
        sessions: Number(p.sessions),
      })),
    });
  } catch (error) {
    console.error('[Analytics Flow] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flow analytics' },
      { status: 500 }
    );
  }
}
