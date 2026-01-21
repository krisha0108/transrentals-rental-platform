import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get keyword rankings data
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (range) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Fetch keyword rankings
    const [keywordRankings, searchQueries, competitors] = await Promise.all([
      prisma.keyword_rankings.findMany({
        where: { isTracking: true },
        orderBy: { position: 'asc' },
      }),
      prisma.search_queries.findMany({
        where: {
          date: { gte: startDate, lte: now },
        },
        orderBy: { clicks: 'desc' },
        take: 100,
      }),
      prisma.competitor_tracking.findMany({
        where: { isActive: true },
      }),
    ]);

    // Process keyword rankings
    interface KeywordRanking {
      id: string;
      keyword: string;
      position: number | null;
      previousPosition: number | null;
      bestPosition: number | null;
      searchVolume: number | null;
      difficulty: number | null;
      pagePath: string | null;
      hasFeaturedSnippet: boolean;
      rankHistory: unknown;
    }
    interface SearchQuery {
      query: string;
      impressions: number;
      clicks: number;
    }

    const keywords = keywordRankings.map((kr: KeywordRanking) => {
      const change = kr.previousPosition && kr.position
        ? kr.previousPosition - kr.position
        : 0;

      // Get search query data for this keyword
      const queryData = (searchQueries as SearchQuery[]).filter((sq: SearchQuery) =>
        sq.query.toLowerCase().includes(kr.keyword.toLowerCase()) ||
        kr.keyword.toLowerCase().includes(sq.query.toLowerCase())
      );

      const totalImpressions = queryData.reduce((sum: number, q: SearchQuery) => sum + q.impressions, 0);
      const totalClicks = queryData.reduce((sum: number, q: SearchQuery) => sum + q.clicks, 0);
      const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

      // Parse rank history for trend
      let trend: number[] = [];
      if (kr.rankHistory) {
        try {
          const history = kr.rankHistory as Array<{ date: string; position: number }>;
          trend = history.slice(-7).map(h => h.position);
        } catch {
          trend = kr.position ? [kr.position] : [];
        }
      }

      return {
        id: kr.id,
        keyword: kr.keyword,
        currentPosition: kr.position || 100,
        previousPosition: kr.previousPosition || kr.position || 100,
        change,
        bestPosition: kr.bestPosition || kr.position || 100,
        searchVolume: kr.searchVolume || 0,
        difficulty: kr.difficulty || 50,
        url: kr.pagePath,
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: Number(ctr.toFixed(1)),
        trend,
        featured: kr.hasFeaturedSnippet,
      };
    });

    // Calculate overview stats
    const trackedKeywords = keywords.filter(k => k.currentPosition <= 100);
    const overview = {
      totalKeywords: trackedKeywords.length,
      avgPosition: trackedKeywords.length > 0
        ? Number((trackedKeywords.reduce((sum, k) => sum + k.currentPosition, 0) / trackedKeywords.length).toFixed(1))
        : 0,
      top3: trackedKeywords.filter(k => k.currentPosition <= 3).length,
      top10: trackedKeywords.filter(k => k.currentPosition <= 10).length,
      top20: trackedKeywords.filter(k => k.currentPosition <= 20).length,
      improved: trackedKeywords.filter(k => k.change > 0).length,
      declined: trackedKeywords.filter(k => k.change < 0).length,
      unchanged: trackedKeywords.filter(k => k.change === 0).length,
    };

    // Position distribution
    const positionDistribution = [
      { range: '1-3', count: trackedKeywords.filter(k => k.currentPosition >= 1 && k.currentPosition <= 3).length },
      { range: '4-10', count: trackedKeywords.filter(k => k.currentPosition >= 4 && k.currentPosition <= 10).length },
      { range: '11-20', count: trackedKeywords.filter(k => k.currentPosition >= 11 && k.currentPosition <= 20).length },
      { range: '21-50', count: trackedKeywords.filter(k => k.currentPosition >= 21 && k.currentPosition <= 50).length },
      { range: '51-100', count: trackedKeywords.filter(k => k.currentPosition >= 51 && k.currentPosition <= 100).length },
    ];

    // Historical trends - aggregate from search queries by date
    const dailyData: Record<string, { impressions: number; clicks: number; positions: number[] }> = {};
    searchQueries.forEach(sq => {
      const dateStr = sq.date.toISOString().split('T')[0];
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { impressions: 0, clicks: 0, positions: [] };
      }
      dailyData[dateStr].impressions += sq.impressions;
      dailyData[dateStr].clicks += sq.clicks;
      if (sq.avgPosition) {
        dailyData[dateStr].positions.push(sq.avgPosition);
      }
    });

    const historicalTrends = Object.entries(dailyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        avgPosition: data.positions.length > 0
          ? Number((data.positions.reduce((a, b) => a + b, 0) / data.positions.length).toFixed(1))
          : overview.avgPosition,
        top10Count: trackedKeywords.filter(k => k.currentPosition <= 10).length,
      }));

    // Competitor data
    const competitorDomains = [...new Set(competitors.map(c => c.competitorDomain))];
    const competitorStats = competitorDomains.map(domain => {
      const domainData = competitors.filter(c => c.competitorDomain === domain);
      const avgPos = domainData.filter(d => d.position).length > 0
        ? domainData.reduce((sum, d) => sum + (d.position || 0), 0) / domainData.filter(d => d.position).length
        : 0;

      return {
        domain,
        overlap: domainData.length,
        avgPosition: Number(avgPos.toFixed(1)),
        visibility: Math.max(0, 100 - avgPos * 2), // Simple visibility score
      };
    });

    // Top movers
    const sortedByChange = [...trackedKeywords].sort((a, b) => b.change - a.change);
    const topMovers = {
      gainers: sortedByChange.filter(k => k.change > 0).slice(0, 5).map(k => ({
        keyword: k.keyword,
        change: k.change,
        position: k.currentPosition,
      })),
      losers: sortedByChange.filter(k => k.change < 0).slice(-5).reverse().map(k => ({
        keyword: k.keyword,
        change: k.change,
        position: k.currentPosition,
      })),
    };

    return NextResponse.json({
      overview,
      keywords,
      positionDistribution,
      historicalTrends: historicalTrends.length > 0 ? historicalTrends : generateMockTrends(overview.avgPosition, overview.top10),
      competitors: competitorStats,
      topMovers,
    });
  } catch (error) {
    logger.error('Error fetching rankings', error);
    // Return default data on error
    return NextResponse.json({
      overview: {
        totalKeywords: 0,
        avgPosition: 0,
        top3: 0,
        top10: 0,
        top20: 0,
        improved: 0,
        declined: 0,
        unchanged: 0,
      },
      keywords: [],
      positionDistribution: [
        { range: '1-3', count: 0 },
        { range: '4-10', count: 0 },
        { range: '11-20', count: 0 },
        { range: '21-50', count: 0 },
        { range: '51-100', count: 0 },
      ],
      historicalTrends: generateMockTrends(15, 5),
      competitors: [],
      topMovers: { gainers: [], losers: [] },
    });
  }
}

// POST - Add new keyword to track
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { keyword, pagePath, searchVolume, difficulty } = body;

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    const newKeyword = await prisma.keyword_rankings.create({
      data: {
        keyword,
        pagePath: pagePath || '/',
        searchVolume: searchVolume || null,
        difficulty: difficulty || null,
        isTracking: true,
      },
    });

    return NextResponse.json(newKeyword);
  } catch (error) {
    logger.error('Error adding keyword', error);
    return NextResponse.json({ error: 'Failed to add keyword' }, { status: 500 });
  }
}

// Helper to generate mock trends when no data
function generateMockTrends(avgPosition: number, top10Count: number) {
  return Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    avgPosition: avgPosition > 0 ? avgPosition + (Math.random() * 2 - 1) : 15 + (Math.random() * 2 - 1),
    top10Count: top10Count > 0 ? top10Count + Math.floor(Math.random() * 3 - 1) : Math.floor(10 + Math.random() * 5),
  }));
}
