import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getCached, setCached, buildCacheKey } from '@/lib/utils/analytics-cache';
import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';
    const section = searchParams.get('section') || 'all';

    const cacheKey = buildCacheKey('analytics', { range, section });
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json({ ...cached, _cached: true });

    const now = new Date();
    const startDate = new Date();
    switch (range) {
      case '24h': startDate.setHours(startDate.getHours() - 24); break;
      case '7d': startDate.setDate(startDate.getDate() - 7); break;
      case '30d': startDate.setDate(startDate.getDate() - 30); break;
      case '90d': startDate.setDate(startDate.getDate() - 90); break;
      default: startDate.setDate(startDate.getDate() - 7);
    }
    const dateFilter = { createdAt: { gte: startDate, lte: now } };
    const today = new Date(); today.setHours(0, 0, 0, 0);

    // ===== PAGE VIEWS — all via aggregation, no full table scan =====
    const [
      totalViews,
      pvDeviceGroups,
      pvBrowserGroups,
      pvPathGroups,
      pvReferrerGroups,
      pvRecent,
      pvDailyRaw,
      pvUniqueRaw,
      pvTodayRaw,
    ] = await Promise.all([
      prisma.page_views.count({ where: dateFilter }),
      prisma.page_views.groupBy({ by: ['device'], where: dateFilter, _count: { id: true } }),
      prisma.page_views.groupBy({ by: ['browser'], where: dateFilter, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }),
      prisma.page_views.groupBy({ by: ['path'], where: dateFilter, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 15 }),
      prisma.page_views.groupBy({ by: ['referrer'], where: dateFilter, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 100 }),
      prisma.page_views.findMany({ where: dateFilter, orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, path: true, device: true, browser: true, country: true, referrer: true, createdAt: true } }),
      prisma.$queryRaw<Array<{ date: string; views: bigint }>>`SELECT DATE(createdAt) as date, COUNT(*) as views FROM page_views WHERE createdAt >= ${startDate} AND createdAt <= ${now} GROUP BY DATE(createdAt) ORDER BY date ASC`,
      prisma.$queryRaw<[{ cnt: bigint }]>`SELECT COUNT(DISTINCT COALESCE(sessionId, ipAddress, 'unknown')) as cnt FROM page_views WHERE createdAt >= ${startDate} AND createdAt <= ${now}`,
      prisma.$queryRaw<[{ views: bigint; visitors: bigint }]>`SELECT COUNT(*) as views, COUNT(DISTINCT COALESCE(sessionId, ipAddress, 'unknown')) as visitors FROM page_views WHERE createdAt >= ${today} AND createdAt <= ${now}`,
    ]);

    const uniqueVisitors = Number(pvUniqueRaw[0]?.cnt || 0);
    const todayViews = Number(pvTodayRaw[0]?.views || 0);
    const todayVisitors = Number(pvTodayRaw[0]?.visitors || 0);

    const deviceBreakdown: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    pvDeviceGroups.forEach((g) => { if (g.device && deviceBreakdown[g.device] !== undefined) deviceBreakdown[g.device] = g._count.id; });

    const browserBreakdown: Record<string, number> = {};
    pvBrowserGroups.forEach((g) => { if (g.browser) browserBreakdown[g.browser] = g._count.id; });

    const topPages = pvPathGroups.map((g) => ({ path: g.path, views: g._count.id }));

    const referrerDomains: Record<string, number> = {};
    pvReferrerGroups.forEach((g) => {
      if (!g.referrer) return;
      try {
        const domain = new URL(g.referrer).hostname;
        referrerDomains[domain] = (referrerDomains[domain] || 0) + g._count.id;
      } catch {
        referrerDomains[g.referrer.substring(0, 100)] = (referrerDomains[g.referrer.substring(0, 100)] || 0) + g._count.id;
      }
    });
    const topReferrers = Object.entries(referrerDomains).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([domain, count]) => ({ domain, count }));

    const chartData = pvDailyRaw.map((row) => ({ date: String(row.date), views: Number(row.views), visitors: Number(row.views) }));

    const trafficSources = { direct: 0, organic: 0, referral: 0, social: 0 };
    pvReferrerGroups.forEach((g) => {
      if (!g.referrer) { trafficSources.direct += g._count.id; return; }
      const ref = g.referrer.toLowerCase();
      if (ref.includes('google') || ref.includes('bing') || ref.includes('yahoo') || ref.includes('duckduckgo')) trafficSources.organic += g._count.id;
      else if (ref.includes('facebook') || ref.includes('twitter') || ref.includes('instagram') || ref.includes('linkedin') || ref.includes('youtube')) trafficSources.social += g._count.id;
      else trafficSources.referral += g._count.id;
    });
    const recentVisits = pvRecent;

    // ===== FORMS — aggregation only =====
    let formStats = { total: 0, submitted: 0, failed: 0, pending: 0, converted: 0, byType: {} as Record<string, number>, byPage: {} as Record<string, number>, avgTimeToFill: 0, conversionRate: 0 };
    let topFormPages: Array<{ path: string; count: number }> = [];
    let recentForms: object[] = [];

    if (section === 'all' || section === 'forms') {
      const [formStatusGroups, formTypeGroups, formPageGroups, formTimeAgg, formRecentRaw] = await Promise.all([
        prisma.form_submissions.groupBy({ by: ['status'], where: dateFilter, _count: { id: true } }),
        prisma.form_submissions.groupBy({ by: ['formType'], where: dateFilter, _count: { id: true } }),
        prisma.form_submissions.groupBy({ by: ['pagePath'], where: dateFilter, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }),
        prisma.form_submissions.aggregate({ where: { ...dateFilter, timeToFill: { gt: 0 } }, _avg: { timeToFill: true }, _count: { id: true } }),
        prisma.form_submissions.findMany({ where: dateFilter, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, formType: true, formName: true, pagePath: true, status: true, serviceType: true, createdAt: true } }),
      ]);
      formStatusGroups.forEach((g) => {
        formStats.total += g._count.id;
        if (g.status === 'SUBMITTED') formStats.submitted = g._count.id;
        else if (g.status === 'FAILED') formStats.failed = g._count.id;
        else if (g.status === 'PENDING') formStats.pending = g._count.id;
        else if (g.status === 'CONVERTED') formStats.converted = g._count.id;
      });
      formTypeGroups.forEach((g) => { formStats.byType[g.formType] = g._count.id; });
      formPageGroups.forEach((g) => { formStats.byPage[g.pagePath] = g._count.id; });
      formStats.avgTimeToFill = Math.round(formTimeAgg._avg.timeToFill || 0);
      if (formStats.total > 0) formStats.conversionRate = Math.round((formStats.submitted / formStats.total) * 100);
      topFormPages = formPageGroups.map((g) => ({ path: g.pagePath, count: g._count.id }));
      recentForms = formRecentRaw;
    }

    // ===== CHAT — aggregation only =====
    let chatStats = { totalSessions: 0, totalMessages: 0, bookingsStarted: 0, bookingsCompleted: 0, kbQueries: 0, byOutcome: {} as Record<string, number>, byPage: {} as Record<string, number>, conversionRate: 0 };
    let topChatPages: Array<{ path: string; count: number }> = [];
    let recentChats: object[] = [];

    if (section === 'all' || section === 'chat') {
      const [chatTypeGroups, chatOutcomeGroups, chatPageGroups, chatSessionsRaw, chatRecentRaw] = await Promise.all([
        prisma.chat_interactions.groupBy({ by: ['interactionType'], where: dateFilter, _count: { id: true } }),
        prisma.chat_interactions.groupBy({ by: ['outcome'], where: dateFilter, _count: { id: true } }),
        prisma.chat_interactions.groupBy({ by: ['pagePath'], where: dateFilter, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 10 }),
        prisma.$queryRaw<[{ cnt: bigint }]>`SELECT COUNT(DISTINCT sessionId) as cnt FROM chat_interactions WHERE createdAt >= ${startDate} AND createdAt <= ${now}`,
        prisma.chat_interactions.findMany({ where: { ...dateFilter, interactionType: { in: ['BOOKING_COMPLETED', 'BOOKING_STARTED'] } }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, interactionType: true, pagePath: true, serviceType: true, outcome: true, createdAt: true } }),
      ]);
      chatStats.totalSessions = Number(chatSessionsRaw[0]?.cnt || 0);
      chatTypeGroups.forEach((g) => {
        if (g.interactionType === 'MESSAGE_SENT') chatStats.totalMessages = g._count.id;
        else if (g.interactionType === 'BOOKING_STARTED') chatStats.bookingsStarted = g._count.id;
        else if (g.interactionType === 'BOOKING_COMPLETED') chatStats.bookingsCompleted = g._count.id;
        else if (g.interactionType === 'KB_QUERY') chatStats.kbQueries = g._count.id;
      });
      chatOutcomeGroups.forEach((g) => { if (g.outcome) chatStats.byOutcome[g.outcome] = g._count.id; });
      chatPageGroups.forEach((g) => { chatStats.byPage[g.pagePath] = g._count.id; });
      if (chatStats.bookingsStarted > 0) chatStats.conversionRate = Math.round((chatStats.bookingsCompleted / chatStats.bookingsStarted) * 100);
      topChatPages = chatPageGroups.map((g) => ({ path: g.pagePath, count: g._count.id }));
      recentChats = chatRecentRaw;
    }

    // ===== CLICKS — aggregation only =====
    let clickStats = { total: 0, byType: {} as Record<string, number>, ctaClicks: 0, phoneClicks: 0, emailClicks: 0, socialClicks: 0, externalLinks: 0, avgScrollDepth: 0 };

    if (section === 'all' || section === 'clicks') {
      const [clickTypeGroups, clickExtCount, scrollAgg] = await Promise.all([
        prisma.click_events.groupBy({ by: ['eventType'], where: dateFilter, _count: { id: true } }),
        prisma.click_events.count({ where: { ...dateFilter, isExternal: true } }),
        prisma.click_events.aggregate({ where: { ...dateFilter, eventType: 'SCROLL_DEPTH', scrollDepth: { gt: 0 } }, _avg: { scrollDepth: true } }),
      ]);
      clickTypeGroups.forEach((g) => {
        clickStats.total += g._count.id;
        clickStats.byType[g.eventType] = g._count.id;
        if (g.eventType === 'CTA_CLICK') clickStats.ctaClicks = g._count.id;
        else if (g.eventType === 'PHONE_CLICK') clickStats.phoneClicks = g._count.id;
        else if (g.eventType === 'EMAIL_CLICK') clickStats.emailClicks = g._count.id;
        else if (g.eventType === 'SOCIAL_CLICK') clickStats.socialClicks = g._count.id;
      });
      clickStats.externalLinks = clickExtCount;
      clickStats.avgScrollDepth = Math.round(scrollAgg._avg.scrollDepth || 0);
    }

    // ===== WEB VITALS — aggregation only =====
    let vitalsStats = {
      totalMeasurements: 0, avgLcp: 0, avgFid: 0, avgCls: 0, avgFcp: 0, avgTtfb: 0, avgInp: 0,
      lcpGood: 0, lcpNeedsImprovement: 0, lcpPoor: 0,
      fidGood: 0, fidNeedsImprovement: 0, fidPoor: 0,
      clsGood: 0, clsNeedsImprovement: 0, clsPoor: 0,
      overallHealth: 'UNKNOWN' as string,
    };
    let pagesWithIssues: object[] = [];

    if (section === 'all' || section === 'vitals') {
      const [vitalsAgg, lcpRatings, fidRatings, clsRatings, pagePerf] = await Promise.all([
        prisma.web_vitals.aggregate({ where: dateFilter, _avg: { lcp: true, fid: true, cls: true, fcp: true, ttfb: true, inp: true }, _count: { id: true } }),
        prisma.web_vitals.groupBy({ by: ['lcpRating'], where: dateFilter, _count: { id: true } }),
        prisma.web_vitals.groupBy({ by: ['fidRating'], where: dateFilter, _count: { id: true } }),
        prisma.web_vitals.groupBy({ by: ['clsRating'], where: dateFilter, _count: { id: true } }),
        prisma.page_performance.findMany({ orderBy: { totalViews: 'desc' }, take: 50, select: { pagePath: true, overallStatus: true, avgLcp: true, avgCls: true, issues: true, totalViews: true } }),
      ]);
      vitalsStats.totalMeasurements = vitalsAgg._count.id;
      vitalsStats.avgLcp = Math.round(vitalsAgg._avg.lcp || 0);
      vitalsStats.avgFid = Math.round(vitalsAgg._avg.fid || 0);
      vitalsStats.avgCls = Number((vitalsAgg._avg.cls || 0).toFixed(3));
      vitalsStats.avgFcp = Math.round(vitalsAgg._avg.fcp || 0);
      vitalsStats.avgTtfb = Math.round(vitalsAgg._avg.ttfb || 0);
      vitalsStats.avgInp = Math.round(vitalsAgg._avg.inp || 0);
      lcpRatings.forEach((g) => {
        if (g.lcpRating === 'GOOD') vitalsStats.lcpGood = g._count.id;
        else if (g.lcpRating === 'NEEDS_IMPROVEMENT') vitalsStats.lcpNeedsImprovement = g._count.id;
        else if (g.lcpRating === 'POOR') vitalsStats.lcpPoor = g._count.id;
      });
      fidRatings.forEach((g) => {
        if (g.fidRating === 'GOOD') vitalsStats.fidGood = g._count.id;
        else if (g.fidRating === 'NEEDS_IMPROVEMENT') vitalsStats.fidNeedsImprovement = g._count.id;
        else if (g.fidRating === 'POOR') vitalsStats.fidPoor = g._count.id;
      });
      clsRatings.forEach((g) => {
        if (g.clsRating === 'GOOD') vitalsStats.clsGood = g._count.id;
        else if (g.clsRating === 'NEEDS_IMPROVEMENT') vitalsStats.clsNeedsImprovement = g._count.id;
        else if (g.clsRating === 'POOR') vitalsStats.clsPoor = g._count.id;
      });
      const totalRatings = vitalsStats.lcpGood + vitalsStats.lcpNeedsImprovement + vitalsStats.lcpPoor;
      if (totalRatings > 0) {
        const goodPct = (vitalsStats.lcpGood + vitalsStats.fidGood + vitalsStats.clsGood) / (totalRatings * 3);
        const poorPct = (vitalsStats.lcpPoor + vitalsStats.fidPoor + vitalsStats.clsPoor) / (totalRatings * 3);
        vitalsStats.overallHealth = poorPct > 0.25 ? 'POOR' : goodPct > 0.75 ? 'HEALTHY' : 'NEEDS_IMPROVEMENT';
      }
      pagesWithIssues = pagePerf
        .filter((p) => p.overallStatus === 'POOR' || p.overallStatus === 'NEEDS_IMPROVEMENT')
        .map((p) => ({ path: p.pagePath, status: p.overallStatus, avgLcp: p.avgLcp, avgCls: p.avgCls, issues: p.issues, totalViews: p.totalViews }));
    }

    // ===== REAL-TIME — active_sessions is a small table =====
    const activeSessions = await prisma.active_sessions.findMany({
      where: { lastActivity: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
      orderBy: { lastActivity: 'desc' },
    });
    const realTimeStats = {
      activeVisitors: activeSessions.length,
      sessions: activeSessions.map((s) => ({ currentPage: s.currentPage, device: s.device, browser: s.browser, country: s.country, pageCount: s.pageCount, hasInteracted: s.hasInteracted, hasChatted: s.hasChatted, hasSubmittedForm: s.hasSubmittedForm, startTime: s.startTime, lastActivity: s.lastActivity })),
    };

    const responseData = {
      summary: { totalViews, uniqueVisitors, todayViews, todayVisitors, avgViewsPerDay: Math.round(totalViews / Math.max(chartData.length, 1)), activeVisitors: realTimeStats.activeVisitors },
      traffic: { deviceBreakdown, browserBreakdown, trafficSources, topPages, topReferrers, chartData },
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
