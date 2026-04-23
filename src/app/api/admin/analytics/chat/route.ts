import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import { getCached, setCached, buildCacheKey } from '@/lib/utils/analytics-cache';
import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    const days = range === '1d' ? 1 : range === '30d' ? 30 : range === '90d' ? 90 : 7;

    const cacheKey = buildCacheKey('analytics:chat', { range });
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json({ ...cached, _cached: true });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch chat interaction data
    const chatInteractions = await prisma.chat_interactions.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate overview metrics
    const totalSessions = new Set(chatInteractions.map((c: { sessionId: string }) => c.sessionId)).size;
    const totalMessages = chatInteractions.filter((c: { interactionType: string }) => c.interactionType === 'MESSAGE_SENT').length;
    const bookingsStarted = chatInteractions.filter((c: { interactionType: string }) => c.interactionType === 'BOOKING_STARTED').length;
    const bookingsCompleted = chatInteractions.filter((c: { interactionType: string }) => c.interactionType === 'BOOKING_COMPLETED').length;
    const kbQueries = chatInteractions.filter((c: { interactionType: string }) => c.interactionType === 'KB_QUERY').length;

    // Calculate conversion rate
    const conversionRate = bookingsStarted > 0
      ? Number(((bookingsCompleted / bookingsStarted) * 100).toFixed(1))
      : 0;

    // Calculate response times
    const responseTimes = chatInteractions
      .filter((c: { responseTime: number | null }) => c.responseTime && c.responseTime > 0)
      .map((c: { responseTime: number | null }) => c.responseTime!);
    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length)
      : 0;

    // Outcomes breakdown
    const outcomeCounts: Record<string, number> = {};
    chatInteractions.forEach((c: { outcome: string | null }) => {
      if (c.outcome) {
        outcomeCounts[c.outcome] = (outcomeCounts[c.outcome] || 0) + 1;
      }
    });

    const outcomes = Object.entries(outcomeCounts)
      .map(([outcome, count]) => ({
        outcome,
        count,
        percentage: Number(((count / Math.max(chatInteractions.length, 1)) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count);

    // Generate trends data
    const trends = [];
    for (let i = Math.min(days - 1, 13); i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayInteractions = chatInteractions.filter((c: { createdAt: Date }) => {
        const created = new Date(c.createdAt);
        return created >= dayStart && created <= dayEnd;
      });

      trends.push({
        date: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
        sessions: new Set(dayInteractions.map((c: { sessionId: string }) => c.sessionId)).size,
        messages: dayInteractions.filter((c: { interactionType: string }) => c.interactionType === 'MESSAGE_SENT').length,
        bookings: dayInteractions.filter((c: { interactionType: string }) => c.interactionType === 'BOOKING_COMPLETED').length,
      });
    }

    // Top pages with chat interactions
    const pageCounts: Record<string, number> = {};
    chatInteractions.forEach((c: { pagePath: string }) => {
      pageCounts[c.pagePath] = (pageCounts[c.pagePath] || 0) + 1;
    });

    const topPages = Object.entries(pageCounts)
      .map(([page, count]) => ({
        page,
        interactions: count,
        percentage: Number(((count / Math.max(chatInteractions.length, 1)) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 10);

    // Service types breakdown
    const serviceCounts: Record<string, number> = {};
    chatInteractions.forEach((c: { serviceType: string | null }) => {
      if (c.serviceType) {
        serviceCounts[c.serviceType] = (serviceCounts[c.serviceType] || 0) + 1;
      }
    });

    const services = Object.entries(serviceCounts)
      .map(([service, count]) => ({
        service,
        count,
        percentage: Number(((count / Math.max(chatInteractions.length, 1)) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent interactions
    const recentInteractions = chatInteractions
      .slice(0, 20)
      .map((c: { id: string; interactionType: string; pagePath: string; serviceType: string | null; outcome: string | null; responseTime: number | null; createdAt: Date }) => ({
        id: c.id,
        type: c.interactionType,
        pagePath: c.pagePath,
        serviceType: c.serviceType,
        outcome: c.outcome,
        responseTime: c.responseTime,
        createdAt: c.createdAt,
      }));

    const result = {
      overview: {
        totalSessions,
        totalMessages,
        bookingsStarted,
        bookingsCompleted,
        kbQueries,
        conversionRate,
        avgResponseTime,
      },
      trends,
      outcomes,
      topPages,
      services,
      recentInteractions,
    };
    setCached(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Chat analytics error', error);
    // Return default data on error
    return NextResponse.json({
      overview: {
        totalSessions: 0,
        totalMessages: 0,
        bookingsStarted: 0,
        bookingsCompleted: 0,
        kbQueries: 0,
        conversionRate: 0,
        avgResponseTime: 0,
      },
      trends: generateMockTrends(),
      outcomes: [
        { outcome: 'BOOKING_COMPLETED', count: 0, percentage: 0 },
        { outcome: 'LEFT_PAGE', count: 0, percentage: 0 },
        { outcome: 'NO_ACTION', count: 0, percentage: 0 },
      ],
      topPages: [
        { page: '/', interactions: 0, percentage: 0 },
        { page: '/activa-on-rent', interactions: 0, percentage: 0 },
      ],
      services: [
        { service: 'bike-rental', count: 0, percentage: 0 },
        { service: 'car-rental', count: 0, percentage: 0 },
      ],
      recentInteractions: [],
    });
  }
}

function generateMockTrends() {
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
    sessions: 0,
    messages: 0,
    bookings: 0,
  }));
}
