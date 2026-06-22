import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getCached, setCached, buildCacheKey } from '@/lib/utils/analytics-cache';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

interface ElementSample {
  elementId: string | null;
  elementText: string | null;
  pagePath: string | null;
  eventType: string;
  sessionId: string | null;
}

interface ElementClickAccum {
  element: string;
  elementType: string;
  page: string;
  clicks: number;
  sessions: Set<string>;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    const cacheKey = buildCacheKey('analytics:clicks', { range });
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json({ ...cached, _cached: true });

    const now = new Date();
    const startDate = new Date();
    switch (range) {
      case '1d': startDate.setHours(startDate.getHours() - 24); break;
      case '7d': startDate.setDate(startDate.getDate() - 7); break;
      case '30d': startDate.setDate(startDate.getDate() - 30); break;
      default: startDate.setDate(startDate.getDate() - 7);
    }
    const dateFilter = { createdAt: { gte: startDate, lte: now } };

    const [
      clickTypeGroups,
      clickExtCount,
      scrollAgg,
      uniqueSessionsRaw,
      deviceGroups,
      dailyRaw,
      hourlyRaw,
      pageHeatmapGroups,
      elementSample,
    ] = await Promise.all([
      prisma.click_events.groupBy({ by: ['eventType'], where: dateFilter, _count: { id: true } }),
      prisma.click_events.count({ where: { ...dateFilter, isExternal: true } }),
      prisma.click_events.aggregate({ where: { ...dateFilter, eventType: 'SCROLL_DEPTH', scrollDepth: { gt: 0 } }, _avg: { scrollDepth: true } }),
      prisma.$queryRaw<[{ cnt: bigint }]>`SELECT COUNT(DISTINCT sessionId) as cnt FROM click_events WHERE createdAt >= ${startDate} AND createdAt <= ${now}`,
      prisma.click_events.groupBy({ by: ['device'], where: dateFilter, _count: { id: true } }),
      prisma.$queryRaw<Array<{ date: string; clicks: bigint; ctaClicks: bigint; linkClicks: bigint }>>`
        SELECT DATE(createdAt) as date,
          COUNT(*) as clicks,
          SUM(CASE WHEN eventType = 'CTA_CLICK' THEN 1 ELSE 0 END) as ctaClicks,
          SUM(CASE WHEN eventType IN ('LINK_CLICK','NAV_CLICK') THEN 1 ELSE 0 END) as linkClicks
        FROM click_events WHERE createdAt >= ${startDate} AND createdAt <= ${now}
        GROUP BY DATE(createdAt) ORDER BY date ASC`,
      prisma.$queryRaw<Array<{ hour: number; clicks: bigint }>>`
        SELECT HOUR(createdAt) as hour, COUNT(*) as clicks
        FROM click_events WHERE createdAt >= ${startDate} AND createdAt <= ${now}
        GROUP BY HOUR(createdAt) ORDER BY hour ASC`,
      prisma.click_events.groupBy({ by: ['pagePath', 'sectionId'], where: dateFilter, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 50 }),
      prisma.click_events.findMany({
        where: dateFilter,
        select: { elementId: true, elementText: true, pagePath: true, eventType: true, sessionId: true },
        orderBy: { createdAt: 'desc' },
        take: 3000,
      }) as Promise<ElementSample[]>,
    ]);

    const totalClicks = clickTypeGroups.reduce((sum, g) => sum + g._count.id, 0);
    const uniqueSessions = Number(uniqueSessionsRaw[0]?.cnt || 0);
    const typeCounts: Record<string, number> = {};
    let ctaClicks = 0, phoneClicks = 0, emailClicks = 0, socialClicks = 0;
    clickTypeGroups.forEach((g) => {
      typeCounts[g.eventType] = g._count.id;
      if (g.eventType === 'CTA_CLICK') ctaClicks = g._count.id;
      else if (g.eventType === 'PHONE_CLICK') phoneClicks = g._count.id;
      else if (g.eventType === 'EMAIL_CLICK') emailClicks = g._count.id;
      else if (g.eventType === 'SOCIAL_CLICK') socialClicks = g._count.id;
    });

    const trends = dailyRaw.map((row) => ({
      date: new Date(String(row.date)).toLocaleDateString('en-US', { weekday: 'short' }),
      clicks: Number(row.clicks),
      ctaClicks: Number(row.ctaClicks),
      linkClicks: Number(row.linkClicks),
    }));

    const typeColors: Record<string, string> = {
      CTA_CLICK: '#3B82F6', NAV_CLICK: '#10B981', PHONE_CLICK: '#F59E0B', LINK_CLICK: '#8B5CF6',
      SOCIAL_CLICK: '#EC4899', EMAIL_CLICK: '#14B8A6', BUTTON_CLICK: '#F97316', IMAGE_CLICK: '#6366F1',
      FORM_SUBMIT: '#22C55E', DOWNLOAD_CLICK: '#EF4444', VIDEO_PLAY: '#A855F7', SCROLL_DEPTH: '#64748B', OTHER: '#6B7280',
    };
    const typeLabels: Record<string, string> = {
      CTA_CLICK: 'CTA Buttons', NAV_CLICK: 'Navigation Links', PHONE_CLICK: 'Phone Links',
      LINK_CLICK: 'Other Links', SOCIAL_CLICK: 'Social Media', EMAIL_CLICK: 'Email Links',
      BUTTON_CLICK: 'Buttons', IMAGE_CLICK: 'Image Clicks', FORM_SUBMIT: 'Form Submits',
      DOWNLOAD_CLICK: 'Downloads', VIDEO_PLAY: 'Video Plays', SCROLL_DEPTH: 'Scroll Events', OTHER: 'Other',
    };
    const clicksByType = Object.entries(typeCounts)
      .filter(([type]) => type !== 'SCROLL_DEPTH')
      .map(([type, count]) => ({
        type: typeLabels[type] || type,
        count,
        percentage: totalClicks > 0 ? Number(((count / totalClicks) * 100).toFixed(1)) : 0,
        color: typeColors[type] || '#6B7280',
      }))
      .sort((a, b) => b.count - a.count);

    const elementClicks: Record<string, ElementClickAccum> = {};
    elementSample.forEach((c) => {
      const key = `${c.elementId || c.elementText || 'Unknown'}-${c.pagePath || '/'}`;
      if (!elementClicks[key]) {
        elementClicks[key] = {
          element: c.elementText || c.elementId || 'Unknown Element',
          elementType: c.eventType.replace('_CLICK', '').replace('_', ' '),
          page: c.pagePath || '/',
          clicks: 0,
          sessions: new Set<string>(),
        };
      }
      elementClicks[key].clicks++;
      if (c.sessionId) elementClicks[key].sessions.add(c.sessionId);
    });
    const topElements = Object.values(elementClicks)
      .map((el) => ({
        element: el.element.substring(0, 50),
        elementType: el.elementType,
        page: el.page,
        clicks: el.clicks,
        uniqueClicks: el.sessions.size,
        ctr: el.sessions.size > 0 ? Number(((el.clicks / el.sessions.size) * 10).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    const ctaPerformance: Record<string, { clicks: number; conversions: number }> = {};
    elementSample
      .filter((c) => c.eventType === 'CTA_CLICK' || c.eventType === 'BUTTON_CLICK' || c.eventType === 'FORM_SUBMIT')
      .forEach((c) => {
        const ctaName = c.elementText || c.elementId || 'Unknown CTA';
        if (!ctaPerformance[ctaName]) ctaPerformance[ctaName] = { clicks: 0, conversions: 0 };
        ctaPerformance[ctaName].clicks++;
        if (c.eventType === 'FORM_SUBMIT') ctaPerformance[ctaName].conversions++;
      });
    const ctaPerformanceArray = Object.entries(ctaPerformance)
      .map(([cta, data]) => ({
        cta: cta.substring(0, 30),
        clicks: data.clicks,
        conversions: data.conversions,
        conversionRate: data.clicks > 0 ? Number(((data.conversions / data.clicks) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    const pageClicksMap: Record<string, Record<string, number>> = {};
    pageHeatmapGroups.forEach((g) => {
      const page = g.pagePath || '/';
      const section = g.sectionId || 'Main';
      if (!pageClicksMap[page]) pageClicksMap[page] = {};
      pageClicksMap[page][section] = (pageClicksMap[page][section] || 0) + g._count.id;
    });
    const clickHeatmap = Object.entries(pageClicksMap)
      .map(([page, sections]) => ({
        page: page === '/' ? 'Homepage' : page,
        sections: Object.entries(sections)
          .map(([section, clicks]) => ({ section, clicks }))
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 5),
      }))
      .sort((a, b) => b.sections.reduce((s, x) => s + x.clicks, 0) - a.sections.reduce((s, x) => s + x.clicks, 0))
      .slice(0, 5);

    const deviceClicks = { desktop: 0, mobile: 0, tablet: 0 };
    deviceGroups.forEach((g) => {
      const d = (g.device || 'desktop').toLowerCase();
      if (d === 'mobile') deviceClicks.mobile = g._count.id;
      else if (d === 'tablet') deviceClicks.tablet = g._count.id;
      else deviceClicks.desktop += g._count.id;
    });

    const hourlyMap: Record<string, number> = {};
    for (let i = 0; i < 24; i++) hourlyMap[`${i}:00`] = 0;
    hourlyRaw.forEach((row) => { hourlyMap[`${row.hour}:00`] = Number(row.clicks); });
    const hourlyClicksArray = Object.entries(hourlyMap).map(([hour, clicks]) => ({ hour, clicks }));

    const result = {
      overview: {
        totalClicks,
        uniqueClicks: uniqueSessions,
        ctaClicks,
        phoneClicks,
        emailClicks,
        socialClicks,
        externalLinks: clickExtCount,
        avgClicksPerSession: uniqueSessions > 0 ? Number((totalClicks / uniqueSessions).toFixed(1)) : 0,
      },
      trends,
      clicksByType,
      topElements,
      ctaPerformance: ctaPerformanceArray,
      clickHeatmap,
      deviceClicks,
      hourlyClicks: hourlyClicksArray,
    };
    setCached(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error fetching click analytics', error);
    return NextResponse.json(
      { error: 'Failed to fetch click analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
