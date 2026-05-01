import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { SERVICE_PARENT_MAP } from '@/lib/constants/service-mapping';
import { STATIC_PAGES } from '@/lib/seo/service-meta-templates';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Map SERVICE_PARENT_MAP parent slugs → actual DB service slugs (same as seo/overview)
const PARENT_TO_DB_SLUG: Record<string, string> = {
  'bike-rental': 'bike-on-rent',
  'self-drive-car-rental': 'self-drive-car-rentals',
  'car-rental-with-driver': 'car-rental',
  'truck-tempo-rental': 'transporter',
  'packers-movers': 'packers-and-movers',
};

// Build dbSlug → number of public sub-service slugs
const SUB_SERVICE_COUNT: Record<string, number> = {};
for (const [childSlug, parentSlug] of Object.entries(SERVICE_PARENT_MAP)) {
  if (!childSlug.includes('/')) {
    const dbSlug = PARENT_TO_DB_SLUG[parentSlug] || parentSlug;
    SUB_SERVICE_COUNT[dbSlug] = (SUB_SERVICE_COUNT[dbSlug] || 0) + 1;
  }
}

// Services that generate pages for ALL active DB locations
const ALL_LOCATIONS_SERVICES = new Set(['bike-on-rent', 'self-drive-car-rentals']);

// GET - Get page analytics data
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

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

    const dateFilter = {
      createdAt: { gte: startDate, lte: now },
    };

    // Batch 1: analytics data (5 queries — stays within connection pool limit of 5)
    const [pageViews, pageAnalytics, pagePerformance, seoAudits, crawlData] = await Promise.all([
      prisma.page_views.findMany({
        where: dateFilter,
        orderBy: { createdAt: 'desc' },
        take: 50000, // cap to avoid memory/timeout issues on large datasets
      }),
      prisma.page_analytics.findMany({
        where: { date: { gte: startDate, lte: now } },
        orderBy: { pageViews: 'desc' },
      }),
      prisma.page_performance.findMany({
        orderBy: { totalViews: 'desc' },
      }),
      prisma.seo_audits.findMany(),
      prisma.crawl_data.findFirst({
        orderBy: { crawlDate: 'desc' },
      }),
    ]);

    // Batch 2: search queries + total site page count (4 queries)
    const [searchQueries, servicesWithCounts, totalActiveLocations, routeCount] = await Promise.all([
      prisma.search_queries.findMany({
        where: { date: { gte: startDate, lte: now } },
      }),
      prisma.services.findMany({
        where: { parentId: null },
        select: {
          slug: true,
          _count: { select: { service_locations: { where: { isActive: true } } } },
        },
      }),
      prisma.locations.count({ where: { isActive: true, type: { in: ['CITY', 'UNION_TERRITORY', 'VILLAGE'] } } }),
      prisma.chauffeur_route_packages.count({ where: { isActive: true } }),
    ]);

    // Compute total site pages (same logic as seo/overview)
    const totalSitePages = (() => {
      let count = STATIC_PAGES.length;
      for (const s of servicesWithCounts) {
        const rawLocs = ALL_LOCATIONS_SERVICES.has(s.slug) ? totalActiveLocations : s._count.service_locations;
        const subCount = SUB_SERVICE_COUNT[s.slug] || 1;
        count += rawLocs * subCount;
      }
      count += routeCount * 2; // each route pair = 2 pages (one-way + round-trip)
      return count;
    })();

    // Aggregate page data
    const pageStats: Record<string, {
      pageViews: number;
      uniqueViews: number;
      avgTimeOnPage: number[];
      bounceRate: number[];
      entrances: number;
      exits: number;
      searchImpressions: number;
      searchClicks: number;
      avgPosition: number[];
      mobileViews: number;
      desktopViews: number;
      tabletViews: number;
      visitors: Set<string>;
    }> = {};

    // Process page views
    // Also build session map for entrance/exit computation
    const sessionMap: Record<string, Array<{ path: string; createdAt: Date }>> = {};

    pageViews.forEach((pv: { path: string; sessionId: string | null; ipAddress: string | null; duration: number | null; device: string | null; createdAt: Date }) => {
      if (!pageStats[pv.path]) {
        pageStats[pv.path] = {
          pageViews: 0,
          uniqueViews: 0,
          avgTimeOnPage: [],
          bounceRate: [],
          entrances: 0,
          exits: 0,
          searchImpressions: 0,
          searchClicks: 0,
          avgPosition: [],
          mobileViews: 0,
          desktopViews: 0,
          tabletViews: 0,
          visitors: new Set(),
        };
      }
      pageStats[pv.path].pageViews++;
      pageStats[pv.path].visitors.add(pv.sessionId || pv.ipAddress || 'unknown');
      if (pv.duration) {
        pageStats[pv.path].avgTimeOnPage.push(pv.duration);
      }
      if (pv.device === 'mobile') pageStats[pv.path].mobileViews++;
      else if (pv.device === 'tablet') pageStats[pv.path].tabletViews++;
      else pageStats[pv.path].desktopViews++;

      // Track page order per session for entrance/exit computation
      const sessionKey = pv.sessionId || pv.ipAddress || 'unknown';
      if (!sessionMap[sessionKey]) sessionMap[sessionKey] = [];
      sessionMap[sessionKey].push({ path: pv.path, createdAt: pv.createdAt });
    });

    // Compute entrances/exits from session data (first/last page per session)
    Object.values(sessionMap).forEach(pages => {
      if (!pages.length) return;
      const sorted = pages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const entryPath = sorted[0].path;
      const exitPath = sorted[sorted.length - 1].path;
      if (pageStats[entryPath]) pageStats[entryPath].entrances++;
      if (pageStats[exitPath]) pageStats[exitPath].exits++;
    });

    // Merge with page analytics data (if available)
    pageAnalytics.forEach((pa: { pagePath: string; entrances: number; exits: number; avgTimeOnPage: number | null }) => {
      if (!pageStats[pa.pagePath]) {
        pageStats[pa.pagePath] = {
          pageViews: 0,
          uniqueViews: 0,
          avgTimeOnPage: [],
          bounceRate: [],
          entrances: 0,
          exits: 0,
          searchImpressions: 0,
          searchClicks: 0,
          avgPosition: [],
          mobileViews: 0,
          desktopViews: 0,
          tabletViews: 0,
          visitors: new Set(),
        };
      }
      // page_analytics entrances/exits take precedence over session-derived values
      pageStats[pa.pagePath].entrances = pa.entrances;
      pageStats[pa.pagePath].exits = pa.exits;
      if (pa.avgTimeOnPage) {
        pageStats[pa.pagePath].avgTimeOnPage.push(pa.avgTimeOnPage);
      }
    });

    // Add search query data
    searchQueries.forEach((sq: { pagePath: string; impressions: number; clicks: number; avgPosition: number | null }) => {
      if (pageStats[sq.pagePath]) {
        pageStats[sq.pagePath].searchImpressions += sq.impressions;
        pageStats[sq.pagePath].searchClicks += sq.clicks;
        if (sq.avgPosition) {
          pageStats[sq.pagePath].avgPosition.push(sq.avgPosition);
        }
      }
    });

    // Build pages array
    const pages = Object.entries(pageStats)
      .map(([url, stats]) => {
        // Find SEO audit and performance data for this page
        const audit = seoAudits.find((a: { pagePath: string }) => a.pagePath === url);
        const perf = pagePerformance.find((p: { pagePath: string }) => p.pagePath === url);

        const avgTime = stats.avgTimeOnPage.length > 0
          ? Math.round(stats.avgTimeOnPage.reduce((a, b) => a + b, 0) / stats.avgTimeOnPage.length)
          : 0;

        const avgPos = stats.avgPosition.length > 0
          ? Number((stats.avgPosition.reduce((a, b) => a + b, 0) / stats.avgPosition.length).toFixed(1))
          : 0;

        const totalViews = stats.pageViews;
        const exitRate = totalViews > 0 ? Number(((stats.exits / totalViews) * 100).toFixed(1)) : 0;
        // bounceRate: use exits/entrances ratio as a proxy (single-page sessions / total sessions entering here)
        const bounceRate = stats.entrances > 0
          ? Number(Math.min(95, Math.max(5, (stats.exits / stats.entrances) * 100)).toFixed(1))
          : 0;

        // Calculate mobile/desktop scores based on performance
        let mobileScore = 80;
        let desktopScore = 85;
        if (perf) {
          const lcpScore = perf.avgLcp ? (perf.avgLcp < 2500 ? 90 : perf.avgLcp < 4000 ? 70 : 50) : 80;
          const clsScore = perf.avgCls ? (perf.avgCls < 0.1 ? 95 : perf.avgCls < 0.25 ? 75 : 50) : 85;
          mobileScore = Math.round((lcpScore + clsScore) / 2 - 5);
          desktopScore = Math.round((lcpScore + clsScore) / 2);
        }

        // Determine status — based on crawl/indexability only, NOT performance score
        // (POOR performance ≠ HTTP error; status badge = indexed/not-indexed/error)
        let status: 'indexed' | 'not-indexed' | 'error' = 'indexed';
        if (audit && !audit.isIndexable) status = 'not-indexed';

        return {
          url,
          title: audit?.pageTitle || perf?.pageTitle || url,
          pageViews: totalViews,
          uniqueViews: stats.visitors.size,
          avgTimeOnPage: avgTime,
          bounceRate,
          entrances: stats.entrances,
          exits: stats.exits,
          exitRate,
          searchImpressions: stats.searchImpressions,
          searchClicks: stats.searchClicks,
          avgPosition: avgPos,
          status,
          lastCrawled: audit?.lastAuditDate
            ? getRelativeTime(audit.lastAuditDate)
            : 'Not crawled',
          mobileScore,
          desktopScore,
        };
      })
      .sort((a, b) => b.pageViews - a.pageViews);

    // Calculate overview stats
    // totalSitePages = actual pages on the site (from DB service-location combos + routes + static)
    // pages.length = only visited pages (from page_views)
    const visitedPageCount = pages.length;
    const avgPageViews = visitedPageCount > 0
      ? Math.round(pages.reduce((sum, p) => sum + p.pageViews, 0) / visitedPageCount)
      : 0;
    const avgTimeOnPage = visitedPageCount > 0
      ? Math.round(pages.reduce((sum, p) => sum + p.avgTimeOnPage, 0) / visitedPageCount)
      : 0;
    const avgBounceRate = visitedPageCount > 0
      ? Number((pages.reduce((sum, p) => sum + p.bounceRate, 0) / visitedPageCount).toFixed(1))
      : 0;

    // Daily trends
    const dailyViews: Record<string, { pageViews: number; visitors: Set<string> }> = {};
    pageViews.forEach((pv: { createdAt: Date; sessionId: string | null; ipAddress: string | null }) => {
      const date = pv.createdAt.toISOString().split('T')[0];
      if (!dailyViews[date]) {
        dailyViews[date] = { pageViews: 0, visitors: new Set() };
      }
      dailyViews[date].pageViews++;
      dailyViews[date].visitors.add(pv.sessionId || pv.ipAddress || 'unknown');
    });

    const trends = Object.entries(dailyViews)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pageViews: data.pageViews,
        uniqueViews: data.visitors.size,
      }));

    // Entry pages (pages with most entrances)
    const entryPages = pages
      .filter(p => p.entrances > 0)
      .sort((a, b) => b.entrances - a.entrances)
      .slice(0, 5)
      .map(p => ({
        page: p.url,
        entrances: p.entrances,
        bounceRate: p.bounceRate,
      }));

    // Exit pages
    const exitPages = pages
      .filter(p => p.exits > 0)
      .sort((a, b) => b.exits - a.exits)
      .slice(0, 5)
      .map(p => ({
        page: p.url,
        exits: p.exits,
        exitRate: p.exitRate,
      }));

    // Page types breakdown (categorize by URL patterns)
    const pageTypes: Record<string, { count: number; views: number }> = {
      'Service Pages': { count: 0, views: 0 },
      'Location Pages': { count: 0, views: 0 },
      'Blog Posts': { count: 0, views: 0 },
      'Info Pages': { count: 0, views: 0 },
      'Other': { count: 0, views: 0 },
    };

    pages.forEach((p: { url: string; pageViews: number }) => {
      if (p.url.includes('/blog')) {
        pageTypes['Blog Posts'].count++;
        pageTypes['Blog Posts'].views += p.pageViews;
      } else if (p.url.includes('-in-') || p.url.match(/\/[a-z-]+\/[a-z-]+$/)) {
        pageTypes['Location Pages'].count++;
        pageTypes['Location Pages'].views += p.pageViews;
      } else if (p.url.includes('rent') || p.url.includes('rental') || p.url.includes('car') || p.url.includes('bike')) {
        pageTypes['Service Pages'].count++;
        pageTypes['Service Pages'].views += p.pageViews;
      } else if (p.url === '/' || p.url.includes('about') || p.url.includes('contact') || p.url.includes('terms')) {
        pageTypes['Info Pages'].count++;
        pageTypes['Info Pages'].views += p.pageViews;
      } else {
        pageTypes['Other'].count++;
        pageTypes['Other'].views += p.pageViews;
      }
    });

    const pageTypesBreakdown = Object.entries(pageTypes)
      .filter(([_, data]) => data.count > 0)
      .map(([type, data]) => ({
        type,
        count: data.count,
        avgViews: data.count > 0 ? Math.round(data.views / data.count) : 0,
      }));

    // Crawl status — prefer crawl_data table, fall back to page status counts
    const indexedCount = pages.filter(p => p.status === 'indexed').length;
    const notIndexedCount = pages.filter(p => p.status === 'not-indexed').length;
    const errorCount = pages.filter(p => p.status === 'error').length;
    const crawlStatus = {
      indexed: crawlData?.indexedPages ?? indexedCount,
      discovered: crawlData ? Math.max(0, crawlData.totalPages - (crawlData.indexedPages || 0)) : 0,
      excluded: crawlData?.nonIndexedPages ?? notIndexedCount,
      errors: crawlData?.errorPages ?? errorCount,
    };

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPages = pages.slice(startIndex, endIndex);
    const totalRecords = pages.length;
    const totalPagesCount = Math.ceil(totalRecords / limit);

    return NextResponse.json({
      overview: {
        totalPages: totalSitePages,
        avgPageViews,
        avgTimeOnPage,
        avgBounceRate,
        indexedPages: crawlStatus.indexed,
        errorPages: crawlStatus.errors,
      },
      pages: paginatedPages,
      pagination: {
        currentPage: page,
        totalPages: totalPagesCount,
        totalRecords,
        limit,
        hasMore: page < totalPagesCount,
      },
      trends: trends.length > 0 ? trends : generateMockTrends(),
      entryPages,
      exitPages,
      pageTypesBreakdown,
      crawlStatus,
    });
  } catch (error) {
    logger.error('Error fetching page analytics', error);
    // Return default data on error
    return NextResponse.json({
      overview: {
        totalPages: 0,
        avgPageViews: 0,
        avgTimeOnPage: 0,
        avgBounceRate: 0,
        indexedPages: 0,
        errorPages: 0,
      },
      pages: [],
      trends: generateMockTrends(),
      entryPages: [],
      exitPages: [],
      pageTypesBreakdown: [],
      crawlStatus: { indexed: 0, discovered: 0, excluded: 0, errors: 0 },
    });
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hours ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function generateMockTrends() {
  return Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    pageViews: Math.floor(Math.random() * 5000) + 3000,
    uniqueViews: Math.floor(Math.random() * 3500) + 2000,
  }));
}

function generateMockEntryPages() {
  return [
    { page: '/', entrances: 5000, bounceRate: 35.2 },
    { page: '/activa-on-rent', entrances: 2500, bounceRate: 28.4 },
    { page: '/self-drive-cars', entrances: 1800, bounceRate: 32.1 },
  ];
}

function generateMockExitPages() {
  return [
    { page: '/', exits: 2000, exitRate: 27.0 },
    { page: '/contact', exits: 1200, exitRate: 39.4 },
    { page: '/activa-on-rent', exits: 800, exitRate: 29.0 },
  ];
}
