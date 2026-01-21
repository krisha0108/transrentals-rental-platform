import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET - Get detailed click analytics data
export async function GET(request: NextRequest) {
  // Check authentication using next-auth
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (range) {
      case '1d':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
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

    // Fetch click events
    const clickEvents = await prisma.click_events.findMany({
      where: dateFilter,
      orderBy: { createdAt: 'desc' },
    });

    // ============= OVERVIEW STATS =============
    const totalClicks = clickEvents.length;
    const uniqueSessions = new Set(clickEvents.map((c: { sessionId: string | null }) => c.sessionId)).size;
    const ctaClicks = clickEvents.filter((c: { eventType: string }) => c.eventType === 'CTA_CLICK').length;
    const phoneClicks = clickEvents.filter((c: { eventType: string }) => c.eventType === 'PHONE_CLICK').length;
    const emailClicks = clickEvents.filter((c: { eventType: string }) => c.eventType === 'EMAIL_CLICK').length;
    const socialClicks = clickEvents.filter((c: { eventType: string }) => c.eventType === 'SOCIAL_CLICK').length;
    const externalLinks = clickEvents.filter((c: { isExternal: boolean }) => c.isExternal).length;
    const avgClicksPerSession = uniqueSessions > 0 ? Number((totalClicks / uniqueSessions).toFixed(1)) : 0;

    // ============= CLICK TRENDS BY DAY =============
    const dailyClicks: Record<string, { clicks: number; ctaClicks: number; linkClicks: number }> = {};
    clickEvents.forEach((c: { createdAt: Date; eventType: string }) => {
      const date = c.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
      if (!dailyClicks[date]) {
        dailyClicks[date] = { clicks: 0, ctaClicks: 0, linkClicks: 0 };
      }
      dailyClicks[date].clicks++;
      if (c.eventType === 'CTA_CLICK') dailyClicks[date].ctaClicks++;
      if (c.eventType === 'LINK_CLICK' || c.eventType === 'NAV_CLICK') dailyClicks[date].linkClicks++;
    });

    const trends = Object.entries(dailyClicks).map(([date, data]) => ({
      date,
      clicks: data.clicks,
      ctaClicks: data.ctaClicks,
      linkClicks: data.linkClicks,
    }));

    // ============= CLICKS BY TYPE =============
    const typeCounts: Record<string, number> = {};
    clickEvents.forEach((c: { eventType: string }) => {
      typeCounts[c.eventType] = (typeCounts[c.eventType] || 0) + 1;
    });

    const typeColors: Record<string, string> = {
      CTA_CLICK: '#3B82F6',
      NAV_CLICK: '#10B981',
      PHONE_CLICK: '#F59E0B',
      LINK_CLICK: '#8B5CF6',
      SOCIAL_CLICK: '#EC4899',
      EMAIL_CLICK: '#14B8A6',
      BUTTON_CLICK: '#F97316',
      IMAGE_CLICK: '#6366F1',
      FORM_SUBMIT: '#22C55E',
      DOWNLOAD_CLICK: '#EF4444',
      VIDEO_PLAY: '#A855F7',
      SCROLL_DEPTH: '#64748B',
      OTHER: '#6B7280',
    };

    const typeLabels: Record<string, string> = {
      CTA_CLICK: 'CTA Buttons',
      NAV_CLICK: 'Navigation Links',
      PHONE_CLICK: 'Phone Links',
      LINK_CLICK: 'Other Links',
      SOCIAL_CLICK: 'Social Media',
      EMAIL_CLICK: 'Email Links',
      BUTTON_CLICK: 'Buttons',
      IMAGE_CLICK: 'Image Clicks',
      FORM_SUBMIT: 'Form Submits',
      DOWNLOAD_CLICK: 'Downloads',
      VIDEO_PLAY: 'Video Plays',
      SCROLL_DEPTH: 'Scroll Events',
      OTHER: 'Other',
    };

    const clicksByType = Object.entries(typeCounts)
      .filter(([type]) => type !== 'SCROLL_DEPTH') // Exclude scroll depth from pie chart
      .map(([type, count]) => ({
        type: typeLabels[type] || type,
        count,
        percentage: totalClicks > 0 ? Number(((count / totalClicks) * 100).toFixed(1)) : 0,
        color: typeColors[type] || '#6B7280',
      }))
      .sort((a, b) => b.count - a.count);

    // ============= TOP CLICKED ELEMENTS =============
    const elementClicks: Record<string, {
      element: string;
      elementType: string;
      page: string;
      clicks: number;
      sessions: Set<string>;
    }> = {};

    clickEvents.forEach((c: { elementId: string | null; elementText: string | null; pagePath: string; eventType: string; sessionId: string | null }) => {
      const key = `${c.elementId || c.elementText || 'Unknown'}-${c.pagePath}`;
      if (!elementClicks[key]) {
        elementClicks[key] = {
          element: c.elementText || c.elementId || 'Unknown Element',
          elementType: c.eventType.replace('_CLICK', '').replace('_', ' '),
          page: c.pagePath,
          clicks: 0,
          sessions: new Set(),
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

    // ============= CTA PERFORMANCE =============
    const ctaEvents = clickEvents.filter((c: { eventType: string }) =>
      c.eventType === 'CTA_CLICK' ||
      c.eventType === 'BUTTON_CLICK' ||
      c.eventType === 'FORM_SUBMIT'
    );

    const ctaPerformance: Record<string, { clicks: number; conversions: number }> = {};
    ctaEvents.forEach((c: { elementText: string | null; elementId: string | null; eventType: string }) => {
      const ctaName = c.elementText || c.elementId || 'Unknown CTA';
      if (!ctaPerformance[ctaName]) {
        ctaPerformance[ctaName] = { clicks: 0, conversions: 0 };
      }
      ctaPerformance[ctaName].clicks++;
      if (c.eventType === 'FORM_SUBMIT') {
        ctaPerformance[ctaName].conversions++;
      }
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

    // ============= CLICK HEATMAP BY PAGE =============
    const pageClicks: Record<string, Record<string, number>> = {};
    clickEvents.forEach((c: { pagePath: string | null; sectionId: string | null }) => {
      const page = c.pagePath || '/';
      const section = c.sectionId || 'Main';
      if (!pageClicks[page]) {
        pageClicks[page] = {};
      }
      pageClicks[page][section] = (pageClicks[page][section] || 0) + 1;
    });

    const clickHeatmap = Object.entries(pageClicks)
      .map(([page, sections]) => ({
        page: page === '/' ? 'Homepage' : page,
        sections: Object.entries(sections)
          .map(([section, clicks]) => ({ section, clicks }))
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 5),
      }))
      .sort((a, b) => {
        const aTotal = a.sections.reduce((sum, s) => sum + s.clicks, 0);
        const bTotal = b.sections.reduce((sum, s) => sum + s.clicks, 0);
        return bTotal - aTotal;
      })
      .slice(0, 5);

    // ============= DEVICE CLICKS =============
    const deviceClicks = { desktop: 0, mobile: 0, tablet: 0 };
    clickEvents.forEach((c: { device: string | null }) => {
      const device = c.device?.toLowerCase() || 'desktop';
      if (device === 'mobile') deviceClicks.mobile++;
      else if (device === 'tablet') deviceClicks.tablet++;
      else deviceClicks.desktop++;
    });

    // ============= HOURLY CLICK PATTERN =============
    const hourlyClicks: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      hourlyClicks[`${i}:00`] = 0;
    }
    clickEvents.forEach((c: { createdAt: Date }) => {
      const hour = c.createdAt.getHours();
      hourlyClicks[`${hour}:00`]++;
    });

    const hourlyClicksArray = Object.entries(hourlyClicks).map(([hour, clicks]) => ({
      hour,
      clicks,
    }));

    return NextResponse.json({
      overview: {
        totalClicks,
        uniqueClicks: uniqueSessions,
        ctaClicks,
        phoneClicks,
        emailClicks,
        socialClicks,
        externalLinks,
        avgClicksPerSession,
      },
      trends,
      clicksByType,
      topElements,
      ctaPerformance: ctaPerformanceArray,
      clickHeatmap,
      deviceClicks,
      hourlyClicks: hourlyClicksArray,
    });
  } catch (error) {
    logger.error('Error fetching click analytics', error);
    return NextResponse.json(
      { error: 'Failed to fetch click analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
