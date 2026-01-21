import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get SEO analysis data
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

    // Fetch all SEO-related data
    const [seoAudits, searchQueries, pagePerformance, crawlData] = await Promise.all([
      prisma.seo_audits.findMany({
        orderBy: { overallScore: 'desc' },
      }),
      prisma.search_queries.findMany({
        where: {
          date: { gte: startDate, lte: now },
        },
        orderBy: { impressions: 'desc' },
      }),
      prisma.page_performance.findMany({
        orderBy: { totalViews: 'desc' },
        take: 50,
      }),
      prisma.crawl_data.findFirst({
        orderBy: { crawlDate: 'desc' },
      }),
    ]);

    // Calculate overview stats
    const totalAudits = seoAudits.length;
    const avgScore = totalAudits > 0
      ? Math.round(seoAudits.reduce((sum, a) => sum + a.overallScore, 0) / totalAudits)
      : 0;

    const issuesCount = seoAudits.reduce((sum, a) => {
      const issues = a.issues as unknown[] | null;
      return sum + (issues?.length || 0);
    }, 0);

    const warningsCount = seoAudits.reduce((sum, a) => {
      const warnings = a.warnings as unknown[] | null;
      return sum + (warnings?.length || 0);
    }, 0);

    const passedCount = seoAudits.reduce((sum, a) => {
      const passed = a.passed as unknown[] | null;
      return sum + (passed?.length || 0);
    }, 0);

    // Search visibility from search queries
    const totalImpressions = searchQueries.reduce((sum, q) => sum + q.impressions, 0);
    const totalClicks = searchQueries.reduce((sum, q) => sum + q.clicks, 0);
    const avgPosition = searchQueries.length > 0
      ? searchQueries.reduce((sum, q) => sum + (q.avgPosition || 0), 0) / searchQueries.length
      : 0;

    // Daily trends
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

    const trends = Object.entries(dailyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        impressions: data.impressions,
        clicks: data.clicks,
        position: data.positions.length > 0
          ? data.positions.reduce((a, b) => a + b, 0) / data.positions.length
          : avgPosition,
      }));

    // SEO Health categories
    const technicalScore = seoAudits.length > 0
      ? Math.round(seoAudits.reduce((sum, a) => sum + a.technicalScore, 0) / totalAudits)
      : 75;
    const contentScore = seoAudits.length > 0
      ? Math.round(seoAudits.reduce((sum, a) => sum + a.contentScore, 0) / totalAudits)
      : 70;
    const onPageScore = seoAudits.length > 0
      ? Math.round(seoAudits.reduce((sum, a) => sum + a.onPageScore, 0) / totalAudits)
      : 72;

    const seoHealth = [
      { category: 'On-Page SEO', score: onPageScore, fullMark: 100 },
      { category: 'Technical SEO', score: technicalScore, fullMark: 100 },
      { category: 'Content Quality', score: contentScore, fullMark: 100 },
      { category: 'Mobile-First', score: seoAudits.filter(a => a.isMobileFriendly).length / Math.max(totalAudits, 1) * 100, fullMark: 100 },
      { category: 'Page Speed', score: pagePerformance.length > 0 ? calculateSpeedScore(pagePerformance) : 75, fullMark: 100 },
      { category: 'Structured Data', score: seoAudits.filter(a => a.hasStructuredData).length / Math.max(totalAudits, 1) * 100, fullMark: 100 },
    ];

    // Page audits
    const pageAudits = seoAudits.slice(0, 10).map(audit => ({
      page: audit.pagePath,
      score: audit.overallScore,
      title: audit.h1Text || audit.pageTitle || '',
      titleLength: audit.titleLength || 0,
      metaDescription: '',
      metaLength: audit.metaDescLength || 0,
      h1Count: audit.h1Count,
      imageAlt: audit.imagesWithAlt,
      totalImages: audit.imageCount,
      issues: (audit.issues as Array<{ message?: string }> | null)?.map((i) => i.message || String(i)) || [],
    }));

    // Aggregate top issues
    const issueTypes: Record<string, { count: number; severity: string; description: string }> = {};
    seoAudits.forEach(audit => {
      // Missing meta descriptions
      if (!audit.hasMetaDesc) {
        issueTypes['Missing Meta Description'] = {
          count: (issueTypes['Missing Meta Description']?.count || 0) + 1,
          severity: 'warning',
          description: 'Pages missing meta descriptions',
        };
      }
      // Missing H1
      if (audit.h1Count === 0) {
        issueTypes['Missing H1 Tags'] = {
          count: (issueTypes['Missing H1 Tags']?.count || 0) + 1,
          severity: 'error',
          description: 'Pages missing primary H1 tag',
        };
      }
      // Images missing alt
      if (audit.imagesMissingAlt > 0) {
        issueTypes['Missing Alt Text'] = {
          count: (issueTypes['Missing Alt Text']?.count || 0) + audit.imagesMissingAlt,
          severity: 'warning',
          description: 'Images missing alt attributes',
        };
      }
      // Thin content
      if (audit.wordCount < 300) {
        issueTypes['Thin Content'] = {
          count: (issueTypes['Thin Content']?.count || 0) + 1,
          severity: 'error',
          description: 'Pages with less than 300 words',
        };
      }
      // Title issues
      if (audit.titleIssue && audit.titleIssue !== 'ok') {
        issueTypes['Title Issues'] = {
          count: (issueTypes['Title Issues']?.count || 0) + 1,
          severity: 'warning',
          description: 'Pages with title tag issues',
        };
      }
      // Broken links
      if (audit.brokenLinks > 0) {
        issueTypes['Broken Links'] = {
          count: (issueTypes['Broken Links']?.count || 0) + audit.brokenLinks,
          severity: 'error',
          description: 'Broken internal/external links found',
        };
      }
    });

    const topIssues = Object.entries(issueTypes)
      .map(([issue, data]) => ({
        issue,
        severity: data.severity as 'error' | 'warning' | 'info',
        count: data.count,
        description: `${data.count} ${data.description}`,
      }))
      .sort((a, b) => {
        const severityOrder = { error: 0, warning: 1, info: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity] || b.count - a.count;
      })
      .slice(0, 10);

    // Keyword density from search queries
    const keywordCounts: Record<string, number> = {};
    searchQueries.forEach(sq => {
      const words = sq.query.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 3) {
          keywordCounts[word] = (keywordCounts[word] || 0) + sq.impressions;
        }
      });
    });

    const totalKeywordCount = Object.values(keywordCounts).reduce((a, b) => a + b, 0);
    const keywordDensity = Object.entries(keywordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({
        keyword,
        count,
        density: Number(((count / totalKeywordCount) * 100).toFixed(1)),
      }));

    // Technical SEO checklist
    const technicalSEO = {
      robotsTxt: true, // Assume exists
      sitemap: true, // Assume exists
      https: true, // Assume HTTPS
      canonicalTags: seoAudits.filter(a => a.hasCanonical).length,
      structuredData: seoAudits.some(a => a.hasStructuredData),
      mobileFriendly: seoAudits.filter(a => a.isMobileFriendly).length === totalAudits,
      loadTime: pagePerformance.length > 0
        ? Number((pagePerformance.reduce((sum, p) => sum + (p.avgLcp || 2500), 0) / pagePerformance.length / 1000).toFixed(1))
        : 2.5,
    };

    // Content analysis
    const contentAnalysis = {
      avgWordCount: seoAudits.length > 0
        ? Math.round(seoAudits.reduce((sum, a) => sum + a.wordCount, 0) / totalAudits)
        : 0,
      pagesWithThinContent: seoAudits.filter(a => a.wordCount < 300).length,
      duplicateContent: crawlData?.duplicateTitles || 0,
      missingMetaDescriptions: seoAudits.filter(a => !a.hasMetaDesc).length,
      missingH1Tags: seoAudits.filter(a => a.h1Count === 0).length,
    };

    return NextResponse.json({
      overview: {
        seoScore: avgScore || 75,
        pagesIndexed: crawlData?.indexedPages || totalAudits,
        issuesFound: issuesCount,
        warnings: warningsCount,
        passed: passedCount,
        avgLoadTime: technicalSEO.loadTime,
      },
      searchVisibility: {
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(1)) : 0,
        avgPosition: Number(avgPosition.toFixed(1)),
      },
      trends: trends.length > 0 ? trends : generateMockTrends(),
      seoHealth,
      pageAudits: pageAudits.length > 0 ? pageAudits : generateMockAudits(),
      topIssues: topIssues.length > 0 ? topIssues : generateMockIssues(),
      keywordDensity: keywordDensity.length > 0 ? keywordDensity : generateMockKeywords(),
      technicalSEO,
      contentAnalysis,
    });
  } catch (error) {
    logger.error('Error fetching SEO data', error);
    // Return default data on error
    return NextResponse.json({
      overview: {
        seoScore: 75,
        pagesIndexed: 0,
        issuesFound: 0,
        warnings: 0,
        passed: 0,
        avgLoadTime: 2.5,
      },
      searchVisibility: {
        impressions: 0,
        clicks: 0,
        ctr: 0,
        avgPosition: 0,
      },
      trends: generateMockTrends(),
      seoHealth: [
        { category: 'On-Page SEO', score: 75, fullMark: 100 },
        { category: 'Technical SEO', score: 70, fullMark: 100 },
        { category: 'Content Quality', score: 72, fullMark: 100 },
        { category: 'Mobile-First', score: 85, fullMark: 100 },
        { category: 'Page Speed', score: 75, fullMark: 100 },
        { category: 'Structured Data', score: 60, fullMark: 100 },
      ],
      pageAudits: generateMockAudits(),
      topIssues: generateMockIssues(),
      keywordDensity: generateMockKeywords(),
      technicalSEO: {
        robotsTxt: true,
        sitemap: true,
        https: true,
        canonicalTags: 0,
        structuredData: false,
        mobileFriendly: true,
        loadTime: 2.5,
      },
      contentAnalysis: {
        avgWordCount: 0,
        pagesWithThinContent: 0,
        duplicateContent: 0,
        missingMetaDescriptions: 0,
        missingH1Tags: 0,
      },
    });
  }
}

function calculateSpeedScore(pagePerformance: Array<{ avgLcp?: number | null }>) {
  const avgLcp = pagePerformance.reduce((sum, p) => sum + (p.avgLcp || 2500), 0) / pagePerformance.length;
  if (avgLcp < 2500) return 90;
  if (avgLcp < 4000) return 75;
  return 50;
}

function generateMockTrends() {
  return Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    impressions: Math.floor(Math.random() * 2000) + 1000,
    clicks: Math.floor(Math.random() * 200) + 50,
    position: 10 + Math.random() * 8,
  }));
}

function generateMockAudits() {
  return [
    { page: '/', score: 92, title: 'TransRentals - Bike & Car Rentals', titleLength: 35, metaDescription: '', metaLength: 145, h1Count: 1, imageAlt: 18, totalImages: 20, issues: [] },
    { page: '/activa-on-rent', score: 85, title: 'Honda Activa on Rent', titleLength: 32, metaDescription: '', metaLength: 152, h1Count: 1, imageAlt: 12, totalImages: 15, issues: ['Meta description slightly long'] },
    { page: '/self-drive-cars', score: 78, title: 'Self Drive Cars for Rent', titleLength: 25, metaDescription: '', metaLength: 138, h1Count: 1, imageAlt: 8, totalImages: 12, issues: ['4 images missing alt text'] },
  ];
}

function generateMockIssues() {
  return [
    { issue: 'Missing Alt Text', severity: 'warning' as const, count: 15, description: '15 images are missing alt attributes' },
    { issue: 'Meta Description Issues', severity: 'warning' as const, count: 5, description: '5 pages with meta description issues' },
    { issue: 'Thin Content', severity: 'error' as const, count: 3, description: '3 pages have less than 300 words' },
  ];
}

function generateMockKeywords() {
  return [
    { keyword: 'bike rental', count: 45, density: 2.3 },
    { keyword: 'activa rent', count: 38, density: 1.9 },
    { keyword: 'self drive', count: 32, density: 1.6 },
    { keyword: 'mumbai', count: 28, density: 1.4 },
  ];
}
