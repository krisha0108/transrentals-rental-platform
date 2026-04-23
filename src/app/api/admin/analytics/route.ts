import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getCached, setCached, buildCacheKey } from '@/lib/utils/analytics-cache';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get comprehensive analytics data for dashboard
export async function GET(request: NextRequest) {
  // Check authentication using next-auth
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';
    const section = searchParams.get('section') || 'all';

    // Return cached response if available (5 min TTL)
    const cacheKey = buildCacheKey('analytics', { range, section });
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, _cached: true });
    }

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (range) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
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
        startDate.setDate(startDate.getDate() - 7);
    }

    const dateFilter = {
      createdAt: {
        gte: startDate,
        lte: now,
      },
    };

    // Fetch all data in parallel for performance
    const [
      pageViews,
      formSubmissions,
      chatInteractions,
      clickEvents,
      webVitals,
      pagePerformance,
      activeSessions,
    ] = await Promise.all([
      prisma.page_views.findMany({ where: dateFilter, orderBy: { createdAt: 'desc' } }),
      section === 'all' || section === 'forms'
        ? prisma.form_submissions.findMany({ where: dateFilter, orderBy: { createdAt: 'desc' } })
        : Promise.resolve([]),
      section === 'all' || section === 'chat'
        ? prisma.chat_interactions.findMany({ where: dateFilter, orderBy: { createdAt: 'desc' } })
        : Promise.resolve([]),
      section === 'all' || section === 'clicks'
        ? prisma.click_events.findMany({ where: dateFilter, orderBy: { createdAt: 'desc' } })
        : Promise.resolve([]),
      section === 'all' || section === 'vitals'
        ? prisma.web_vitals.findMany({ where: dateFilter, orderBy: { createdAt: 'desc' } })
        : Promise.resolve([]),
      section === 'all' || section === 'vitals'
        ? prisma.page_performance.findMany({ orderBy: { totalViews: 'desc' }, take: 50 })
        : Promise.resolve([]),
      prisma.active_sessions.findMany({
        where: { lastActivity: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
        orderBy: { lastActivity: 'desc' },
      }),
    ]);

    // ============= TRAFFIC ANALYTICS =============
    const totalViews = pageViews.length;
    const uniqueVisitors = new Set(pageViews.map((pv) => pv.sessionId || pv.ipAddress)).size;

    // Device breakdown
    const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    pageViews.forEach((pv) => {
      if (pv.device && deviceCounts[pv.device] !== undefined) {
        deviceCounts[pv.device]++;
      }
    });

    // Browser breakdown
    const browserCounts: Record<string, number> = {};
    pageViews.forEach((pv) => {
      if (pv.browser) {
        browserCounts[pv.browser] = (browserCounts[pv.browser] || 0) + 1;
      }
    });

    // Top pages
    const pageCounts: Record<string, number> = {};
    pageViews.forEach((pv) => {
      pageCounts[pv.path] = (pageCounts[pv.path] || 0) + 1;
    });
    const topPages = Object.entries(pageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([path, views]) => ({ path, views }));

    // Top referrers
    const referrerCounts: Record<string, number> = {};
    pageViews.forEach((pv) => {
      if (pv.referrer) {
        try {
          const url = new URL(pv.referrer);
          const domain = url.hostname;
          referrerCounts[domain] = (referrerCounts[domain] || 0) + 1;
        } catch {
          referrerCounts[pv.referrer] = (referrerCounts[pv.referrer] || 0) + 1;
        }
      }
    });
    const topReferrers = Object.entries(referrerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));

    // Daily chart data
    const dailyViews: Record<string, { views: number; visitors: Set<string> }> = {};
    pageViews.forEach((pv) => {
      const date = pv.createdAt.toISOString().split('T')[0];
      if (!dailyViews[date]) {
        dailyViews[date] = { views: 0, visitors: new Set() };
      }
      dailyViews[date].views++;
      dailyViews[date].visitors.add(pv.sessionId || pv.ipAddress || 'unknown');
    });

    const chartData = Object.entries(dailyViews)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date,
        views: data.views,
        visitors: data.visitors.size,
      }));

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayViews = pageViews.filter((pv) => pv.createdAt >= today).length;
    const todayVisitors = new Set(
      pageViews.filter((pv) => pv.createdAt >= today).map((pv) => pv.sessionId || pv.ipAddress)
    ).size;

    // ============= FORM ANALYTICS =============
    const formStats = {
      total: formSubmissions.length,
      submitted: formSubmissions.filter((f) => f.status === 'SUBMITTED').length,
      failed: formSubmissions.filter((f) => f.status === 'FAILED').length,
      pending: formSubmissions.filter((f) => f.status === 'PENDING').length,
      converted: formSubmissions.filter((f) => f.status === 'CONVERTED').length,
      byType: {} as Record<string, number>,
      byPage: {} as Record<string, number>,
      avgTimeToFill: 0,
      conversionRate: 0,
    };

    formSubmissions.forEach((f) => {
      formStats.byType[f.formType] = (formStats.byType[f.formType] || 0) + 1;
      formStats.byPage[f.pagePath] = (formStats.byPage[f.pagePath] || 0) + 1;
    });

    const filledForms = formSubmissions.filter((f) => f.timeToFill && f.timeToFill > 0);
    if (filledForms.length > 0) {
      formStats.avgTimeToFill = Math.round(
        filledForms.reduce((sum, f) => sum + (f.timeToFill || 0), 0) / filledForms.length
      );
    }

    if (formStats.total > 0) {
      formStats.conversionRate = Math.round((formStats.submitted / formStats.total) * 100);
    }

    const topFormPages = Object.entries(formStats.byPage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    // ============= CHAT/SHIVI ANALYTICS =============
    const chatSessions = new Set(chatInteractions.map((c) => c.sessionId)).size;
    const chatStats = {
      totalSessions: chatSessions,
      totalMessages: chatInteractions.filter((c) => c.interactionType === 'MESSAGE_SENT').length,
      bookingsStarted: chatInteractions.filter((c) => c.interactionType === 'BOOKING_STARTED').length,
      bookingsCompleted: chatInteractions.filter((c) => c.interactionType === 'BOOKING_COMPLETED').length,
      kbQueries: chatInteractions.filter((c) => c.interactionType === 'KB_QUERY').length,
      byOutcome: {} as Record<string, number>,
      byPage: {} as Record<string, number>,
      conversionRate: 0,
    };

    chatInteractions.forEach((c) => {
      if (c.outcome) {
        chatStats.byOutcome[c.outcome] = (chatStats.byOutcome[c.outcome] || 0) + 1;
      }
      chatStats.byPage[c.pagePath] = (chatStats.byPage[c.pagePath] || 0) + 1;
    });

    if (chatStats.bookingsStarted > 0) {
      chatStats.conversionRate = Math.round(
        (chatStats.bookingsCompleted / chatStats.bookingsStarted) * 100
      );
    }

    const topChatPages = Object.entries(chatStats.byPage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    // ============= CLICK ANALYTICS =============
    const clickStats = {
      total: clickEvents.length,
      byType: {} as Record<string, number>,
      ctaClicks: clickEvents.filter((c) => c.eventType === 'CTA_CLICK').length,
      phoneClicks: clickEvents.filter((c) => c.eventType === 'PHONE_CLICK').length,
      emailClicks: clickEvents.filter((c) => c.eventType === 'EMAIL_CLICK').length,
      socialClicks: clickEvents.filter((c) => c.eventType === 'SOCIAL_CLICK').length,
      externalClicks: clickEvents.filter((c) => c.isExternal).length,
      avgScrollDepth: 0,
    };

    clickEvents.forEach((c) => {
      clickStats.byType[c.eventType] = (clickStats.byType[c.eventType] || 0) + 1;
    });

    const scrollEvents = clickEvents.filter((c) => c.eventType === 'SCROLL_DEPTH' && c.scrollDepth);
    if (scrollEvents.length > 0) {
      clickStats.avgScrollDepth = Math.round(
        scrollEvents.reduce((sum, c) => sum + (c.scrollDepth || 0), 0) / scrollEvents.length
      );
    }

    // ============= WEB VITALS ANALYTICS =============
    const vitalsStats = {
      totalMeasurements: webVitals.length,
      avgLcp: 0,
      avgFid: 0,
      avgCls: 0,
      avgFcp: 0,
      avgTtfb: 0,
      avgInp: 0,
      lcpGood: 0,
      lcpNeedsImprovement: 0,
      lcpPoor: 0,
      fidGood: 0,
      fidNeedsImprovement: 0,
      fidPoor: 0,
      clsGood: 0,
      clsNeedsImprovement: 0,
      clsPoor: 0,
      overallHealth: 'UNKNOWN' as string,
    };

    // Calculate averages
    const lcpValues = webVitals.filter((v) => v.lcp).map((v) => v.lcp!);
    const fidValues = webVitals.filter((v) => v.fid).map((v) => v.fid!);
    const clsValues = webVitals.filter((v) => v.cls).map((v) => v.cls!);
    const fcpValues = webVitals.filter((v) => v.fcp).map((v) => v.fcp!);
    const ttfbValues = webVitals.filter((v) => v.ttfb).map((v) => v.ttfb!);
    const inpValues = webVitals.filter((v) => v.inp).map((v) => v.inp!);

    if (lcpValues.length) vitalsStats.avgLcp = Math.round(lcpValues.reduce((a, b) => a + b) / lcpValues.length);
    if (fidValues.length) vitalsStats.avgFid = Math.round(fidValues.reduce((a, b) => a + b) / fidValues.length);
    if (clsValues.length) vitalsStats.avgCls = Number((clsValues.reduce((a, b) => a + b) / clsValues.length).toFixed(3));
    if (fcpValues.length) vitalsStats.avgFcp = Math.round(fcpValues.reduce((a, b) => a + b) / fcpValues.length);
    if (ttfbValues.length) vitalsStats.avgTtfb = Math.round(ttfbValues.reduce((a, b) => a + b) / ttfbValues.length);
    if (inpValues.length) vitalsStats.avgInp = Math.round(inpValues.reduce((a, b) => a + b) / inpValues.length);

    // Count ratings
    webVitals.forEach((v) => {
      if (v.lcpRating === 'GOOD') vitalsStats.lcpGood++;
      else if (v.lcpRating === 'NEEDS_IMPROVEMENT') vitalsStats.lcpNeedsImprovement++;
      else if (v.lcpRating === 'POOR') vitalsStats.lcpPoor++;

      if (v.fidRating === 'GOOD') vitalsStats.fidGood++;
      else if (v.fidRating === 'NEEDS_IMPROVEMENT') vitalsStats.fidNeedsImprovement++;
      else if (v.fidRating === 'POOR') vitalsStats.fidPoor++;

      if (v.clsRating === 'GOOD') vitalsStats.clsGood++;
      else if (v.clsRating === 'NEEDS_IMPROVEMENT') vitalsStats.clsNeedsImprovement++;
      else if (v.clsRating === 'POOR') vitalsStats.clsPoor++;
    });

    // Determine overall health
    const totalRatings = vitalsStats.lcpGood + vitalsStats.lcpNeedsImprovement + vitalsStats.lcpPoor;
    if (totalRatings > 0) {
      const goodPercentage = (vitalsStats.lcpGood + vitalsStats.fidGood + vitalsStats.clsGood) / (totalRatings * 3);
      const poorPercentage = (vitalsStats.lcpPoor + vitalsStats.fidPoor + vitalsStats.clsPoor) / (totalRatings * 3);

      if (poorPercentage > 0.25) vitalsStats.overallHealth = 'POOR';
      else if (goodPercentage > 0.75) vitalsStats.overallHealth = 'HEALTHY';
      else vitalsStats.overallHealth = 'NEEDS_IMPROVEMENT';
    }

    // Pages with issues
    const pagesWithIssues = pagePerformance
      .filter((p) => p.overallStatus === 'POOR' || p.overallStatus === 'NEEDS_IMPROVEMENT')
      .map((p) => ({
        path: p.pagePath,
        status: p.overallStatus,
        avgLcp: p.avgLcp,
        avgCls: p.avgCls,
        issues: p.issues,
        totalViews: p.totalViews,
      }));

    // ============= REAL-TIME DATA =============
    const realTimeStats = {
      activeVisitors: activeSessions.length,
      sessions: activeSessions.map((s) => ({
        currentPage: s.currentPage,
        device: s.device,
        browser: s.browser,
        country: s.country,
        pageCount: s.pageCount,
        hasInteracted: s.hasInteracted,
        hasChatted: s.hasChatted,
        hasSubmittedForm: s.hasSubmittedForm,
        startTime: s.startTime,
        lastActivity: s.lastActivity,
      })),
    };

    // ============= TRAFFIC SOURCES =============
    const trafficSources = {
      direct: 0,
      organic: 0,
      referral: 0,
      social: 0,
    };

    pageViews.forEach((pv) => {
      if (!pv.referrer) {
        trafficSources.direct++;
      } else {
        const ref = pv.referrer.toLowerCase();
        if (ref.includes('google') || ref.includes('bing') || ref.includes('yahoo') || ref.includes('duckduckgo')) {
          trafficSources.organic++;
        } else if (ref.includes('facebook') || ref.includes('twitter') || ref.includes('instagram') || ref.includes('linkedin') || ref.includes('youtube')) {
          trafficSources.social++;
        } else {
          trafficSources.referral++;
        }
      }
    });

    // Recent activity (last 20 items from each category)
    const recentVisits = pageViews.slice(0, 20).map((pv) => ({
      id: pv.id,
      path: pv.path,
      device: pv.device,
      browser: pv.browser,
      country: pv.country,
      referrer: pv.referrer,
      createdAt: pv.createdAt,
    }));

    const recentForms = formSubmissions.slice(0, 10).map((f) => ({
      id: f.id,
      formType: f.formType,
      formName: f.formName,
      pagePath: f.pagePath,
      status: f.status,
      serviceType: f.serviceType,
      createdAt: f.createdAt,
    }));

    const recentChats = chatInteractions
      .filter((c) => c.interactionType === 'BOOKING_COMPLETED' || c.interactionType === 'BOOKING_STARTED')
      .slice(0, 10)
      .map((c) => ({
        id: c.id,
        type: c.interactionType,
        pagePath: c.pagePath,
        serviceType: c.serviceType,
        outcome: c.outcome,
        createdAt: c.createdAt,
      }));

    const responseData = {
      summary: {
        totalViews,
        uniqueVisitors,
        todayViews,
        todayVisitors,
        avgViewsPerDay: Math.round(totalViews / Math.max(chartData.length, 1)),
        activeVisitors: realTimeStats.activeVisitors,
      },
      traffic: { deviceBreakdown: deviceCounts, browserBreakdown: browserCounts, trafficSources, topPages, topReferrers, chartData },
      forms: { stats: formStats, topPages: topFormPages, recent: recentForms },
      chat: { stats: chatStats, topPages: topChatPages, recent: recentChats },
      clicks: { stats: clickStats },
      performance: { vitals: vitalsStats, pagesWithIssues },
      realTime: realTimeStats,
      recent: { visits: recentVisits, forms: recentForms, chats: recentChats },
    };
    setCached(cacheKey, responseData);
    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('Error fetching analytics', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
