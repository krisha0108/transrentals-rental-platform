import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { getCached, setCached, buildCacheKey } from '@/lib/utils/analytics-cache';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

interface ChatInteraction {
  id: string;
  sessionId: string;
  interactionType: string;
  userMessage: string | null;
  pagePath: string;
  serviceType: string | null;
  serviceName: string | null;
  kbSearchQuery: string | null;
  kbArticleId: string | null;
  outcome: string | null;
  responseTime: number | null;
  createdAt: Date;
}

/** Outcomes that mean the visitor got what they came for. */
const RESOLVED_OUTCOMES = new Set(['RESOLVED', 'BOOKING_SUBMITTED', 'CONTACT_INFO_SHARED']);

const OUTCOME_LABELS: Record<string, string> = {
  IN_PROGRESS: 'In Progress',
  BOOKING_SUBMITTED: 'Booking Submitted',
  CONTACT_INFO_SHARED: 'Contact Shared',
  ABANDONED: 'Abandoned',
  RESOLVED: 'Resolved',
  ESCALATED: 'Escalated',
};

const OUTCOME_COLORS: Record<string, string> = {
  IN_PROGRESS: '#8B5CF6',
  BOOKING_SUBMITTED: '#10B981',
  CONTACT_INFO_SHARED: '#14B8A6',
  ABANDONED: '#EF4444',
  RESOLVED: '#3B82F6',
  ESCALATED: '#F59E0B',
};

const TYPE_LABELS: Record<string, string> = {
  CHAT_OPENED: 'Opened Chat',
  CHAT_CLOSED: 'Closed Chat',
  MESSAGE_SENT: 'Sent a Message',
  OPTION_SELECTED: 'Picked an Option',
  BOOKING_STARTED: 'Started Booking',
  BOOKING_COMPLETED: 'Completed Booking',
  KB_QUERY: 'Asked a Question',
  HELP_REQUESTED: 'Asked for Help',
};

/** Percent change vs the previous window. `null` = no baseline, rendered as a dash. */
const pctChange = (current: number, previous: number): number | null => {
  if (previous <= 0) return current > 0 ? null : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
};

function formatDuration(ms: number): string {
  if (ms <= 0) return '0s';
  const totalSeconds = Math.round(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function getRelativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

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

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    // The window immediately before this one, same length, for real deltas.
    const prevStart = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    const select = {
      id: true, sessionId: true, interactionType: true, userMessage: true, pagePath: true,
      serviceType: true, serviceName: true, kbSearchQuery: true, kbArticleId: true,
      outcome: true, responseTime: true, createdAt: true,
    };

    const [interactions, prevInteractions] = await Promise.all([
      prisma.chat_interactions.findMany({
        where: { createdAt: { gte: startDate, lte: now } },
        orderBy: { createdAt: 'desc' },
        select,
      }) as Promise<ChatInteraction[]>,
      prisma.chat_interactions.findMany({
        where: { createdAt: { gte: prevStart, lt: startDate } },
        select: { sessionId: true, interactionType: true, outcome: true },
      }),
    ]);

    // ===== Group into conversations (one per chat session) =====
    const conversations = new Map<string, ChatInteraction[]>();
    interactions.forEach((c) => {
      const bucket = conversations.get(c.sessionId);
      if (bucket) bucket.push(c);
      else conversations.set(c.sessionId, [c]);
    });

    const totalConversations = conversations.size;
    const totalMessages = interactions.filter((c) => c.interactionType === 'MESSAGE_SENT').length;
    const bookingsFromChat = interactions.filter((c) => c.interactionType === 'BOOKING_COMPLETED').length;
    // A KB query counts as answered only when it actually matched an article.
    const kbQueriesAnswered = interactions.filter((c) => c.interactionType === 'KB_QUERY' && c.kbArticleId).length;

    // A conversation is resolved when its latest outcome is one of the resolved states.
    let resolvedConversations = 0;
    conversations.forEach((rows) => {
      const latest = rows.reduce((a, b) => (new Date(a.createdAt) >= new Date(b.createdAt) ? a : b));
      if (latest.outcome && RESOLVED_OUTCOMES.has(latest.outcome)) resolvedConversations++;
    });
    const resolutionRate = totalConversations > 0
      ? Number(((resolvedConversations / totalConversations) * 100).toFixed(1))
      : 0;

    const avgConversationLength = totalConversations > 0
      ? Number((totalMessages / totalConversations).toFixed(1))
      : 0;

    // responseTime is recorded in milliseconds; the card reads it as seconds.
    const responseTimes = interactions
      .filter((c) => c.responseTime && c.responseTime > 0)
      .map((c) => c.responseTime as number);
    const avgResponseTime = responseTimes.length > 0
      ? Number((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / 1000).toFixed(1))
      : 0;

    // ===== Daily trends across the whole selected range =====
    const dayKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const byDay = new Map<string, ChatInteraction[]>();
    interactions.forEach((c) => {
      const k = dayKey(new Date(c.createdAt));
      const bucket = byDay.get(k);
      if (bucket) bucket.push(c);
      else byDay.set(k, [c]);
    });

    const trends = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const rows = byDay.get(dayKey(date)) || [];
      trends.push({
        // Weekday names repeat once the range passes a week; day + month stays readable.
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        conversations: new Set(rows.map((c) => c.sessionId)).size,
        messages: rows.filter((c) => c.interactionType === 'MESSAGE_SENT').length,
        resolutions: rows.filter((c) => c.outcome && RESOLVED_OUTCOMES.has(c.outcome)).length,
      });
    }

    // ===== Hourly activity — conversations started per hour of day =====
    const hourlyCounts = new Map<number, Set<string>>();
    interactions.forEach((c) => {
      const h = new Date(c.createdAt).getHours();
      const set = hourlyCounts.get(h) || new Set<string>();
      set.add(c.sessionId);
      hourlyCounts.set(h, set);
    });
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      conversations: hourlyCounts.get(hour)?.size || 0,
    }));

    // ===== Intent — what the visitor actually did in the chat =====
    const intentCounts: Record<string, number> = {};
    interactions.forEach((c) => {
      const label = TYPE_LABELS[c.interactionType] || c.interactionType;
      intentCounts[label] = (intentCounts[label] || 0) + 1;
    });
    const intentAnalysis = Object.entries(intentCounts)
      .map(([intent, count]) => ({
        intent,
        count,
        percentage: interactions.length > 0 ? Number(((count / interactions.length) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // ===== Outcome distribution — one row per conversation's latest outcome =====
    const outcomeCounts: Record<string, number> = {};
    conversations.forEach((rows) => {
      const latest = rows.reduce((a, b) => (new Date(a.createdAt) >= new Date(b.createdAt) ? a : b));
      const key = latest.outcome || 'IN_PROGRESS';
      outcomeCounts[key] = (outcomeCounts[key] || 0) + 1;
    });
    const outcomeDistribution = Object.entries(outcomeCounts)
      .map(([outcome, count]) => ({
        outcome: OUTCOME_LABELS[outcome] || outcome,
        count,
        color: OUTCOME_COLORS[outcome] || '#6B7280',
      }))
      .sort((a, b) => b.count - a.count);

    // ===== Top questions — real text the visitor typed =====
    const questionCounts = new Map<string, { count: number; kbHits: number }>();
    interactions.forEach((c) => {
      const text = (c.kbSearchQuery || c.userMessage || '').trim();
      if (!text) return;
      const key = text.length > 90 ? `${text.slice(0, 90)}…` : text;
      const entry = questionCounts.get(key) || { count: 0, kbHits: 0 };
      entry.count++;
      if (c.kbArticleId) entry.kbHits++;
      questionCounts.set(key, entry);
    });
    const topQuestions = Array.from(questionCounts.entries())
      .map(([question, data]) => ({
        question,
        count: data.count,
        resolution: data.kbHits > 0 ? 'KB' : 'AGENT',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ===== Recent conversations — rolled up per session =====
    const recentConversations = Array.from(conversations.entries())
      .map(([sessionId, rows]) => {
        const sorted = [...rows].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const service = sorted.find((c) => c.serviceName || c.serviceType);
        return {
          id: sessionId,
          // Full session ids are long and carry no meaning at a glance.
          sessionId: sessionId.length > 14 ? `${sessionId.slice(0, 14)}…` : sessionId,
          messages: rows.filter((c) => c.interactionType === 'MESSAGE_SENT').length,
          duration: formatDuration(new Date(last.createdAt).getTime() - new Date(first.createdAt).getTime()),
          intent: service?.serviceName || service?.serviceType || TYPE_LABELS[first.interactionType] || 'General',
          outcome: OUTCOME_LABELS[last.outcome || 'IN_PROGRESS'] || 'In Progress',
          timestamp: getRelativeTime(last.createdAt),
          _sortKey: new Date(last.createdAt).getTime(),
        };
      })
      .sort((a, b) => b._sortKey - a._sortKey)
      .slice(0, 20)
      .map(({ _sortKey, ...rest }) => rest);

    // ===== Bot performance radar — every axis is a measured rate, 0-100 =====
    // Nothing here is invented: each value is a real ratio scaled to the chart's domain.
    const openedChats = new Set(
      interactions.filter((c) => c.interactionType === 'CHAT_OPENED').map((c) => c.sessionId)
    ).size;
    const engagedChats = new Set(
      interactions
        .filter((c) => c.interactionType === 'MESSAGE_SENT' || c.interactionType === 'OPTION_SELECTED')
        .map((c) => c.sessionId)
    ).size;
    const abandonedChats = Array.from(conversations.values()).filter((rows) => {
      const latest = rows.reduce((a, b) => (new Date(a.createdAt) >= new Date(b.createdAt) ? a : b));
      return latest.outcome === 'ABANDONED';
    }).length;
    const kbQueries = interactions.filter((c) => c.interactionType === 'KB_QUERY').length;
    const bookingsStarted = interactions.filter((c) => c.interactionType === 'BOOKING_STARTED').length;
    const rate = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

    const performanceMetrics = [
      { metric: 'Engagement', value: rate(engagedChats, openedChats || totalConversations), fullMark: 100 },
      { metric: 'Resolution', value: Math.round(resolutionRate), fullMark: 100 },
      { metric: 'KB Answer Rate', value: rate(kbQueriesAnswered, kbQueries), fullMark: 100 },
      { metric: 'Booking Start', value: rate(bookingsStarted, totalConversations), fullMark: 100 },
      { metric: 'Booking Complete', value: rate(bookingsFromChat, bookingsStarted), fullMark: 100 },
      // With no conversations there is nothing to retain — 100 - 0 would have read as
      // a perfect score on an empty period.
      { metric: 'Retention', value: totalConversations > 0 ? 100 - rate(abandonedChats, totalConversations) : 0, fullMark: 100 },
    ];

    // ===== Previous window, for the stat-card deltas =====
    const prevConversations = new Set(prevInteractions.map((c) => c.sessionId)).size;
    const prevMessages = prevInteractions.filter((c) => c.interactionType === 'MESSAGE_SENT').length;
    const prevBookings = prevInteractions.filter((c) => c.interactionType === 'BOOKING_COMPLETED').length;
    const prevBySession = new Map<string, string | null>();
    prevInteractions.forEach((c) => prevBySession.set(c.sessionId, c.outcome));
    const prevResolved = Array.from(prevBySession.values()).filter((o) => o && RESOLVED_OUTCOMES.has(o)).length;
    const prevResolutionRate = prevConversations > 0
      ? Number(((prevResolved / prevConversations) * 100).toFixed(1))
      : 0;

    const result = {
      overview: {
        totalConversations,
        totalMessages,
        avgResponseTime,
        resolutionRate,
        avgConversationLength,
        // The widget never collects a rating, so there is no satisfaction score to
        // report. null tells the UI to say "not tracked" instead of showing a number.
        satisfactionScore: null,
        bookingsFromChat,
        kbQueriesAnswered,
      },
      changes: {
        totalConversations: pctChange(totalConversations, prevConversations),
        totalMessages: pctChange(totalMessages, prevMessages),
        resolutionRate: pctChange(resolutionRate, prevResolutionRate),
        bookingsFromChat: pctChange(bookingsFromChat, prevBookings),
      },
      trends,
      hourlyActivity,
      intentAnalysis,
      outcomeDistribution,
      topQuestions,
      recentConversations,
      performanceMetrics,
    };
    setCached(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Chat analytics error', error);
    // Fail loudly rather than returning a zeroed-out shape that reads as "no chats".
    return NextResponse.json({ error: 'Failed to fetch chat analytics' }, { status: 500 });
  }
}
