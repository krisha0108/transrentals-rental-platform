// @ts-nocheck
//
// Travel agent notifications inbox.
//
//   GET    ?filter=all|unread|lead|payment|booking|chat|system&cursor=<id>&limit=20
//          → { items, nextCursor, unreadCount }
//   PATCH  body: { action: 'markRead' | 'markAllRead', ids?: string[] }
//          → { updated }
//   DELETE body: { ids: string[] } | { all: true }
//          → { deleted }

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const TYPE_BY_FILTER: Record<string, string | null> = {
  all: null,
  unread: null,
  lead: 'LEAD',
  payment: 'PAYMENT',
  booking: 'BOOKING',
  chat: 'CHAT',
  system: 'SYSTEM',
};

function parseLimit(raw: string | null): number {
  const n = Number(raw);
  if (!isFinite(n) || n <= 0) return 20;
  return Math.min(50, Math.floor(n));
}

function projectItem(n: any) {
  let metadata: any = null;
  if (n.metadata) {
    try { metadata = JSON.parse(n.metadata); } catch { /* swallow */ }
  }
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    metadata,
    isRead: n.isRead,
    readAt: n.readAt,
    createdAt: n.createdAt,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const travelAgentId = auth.travelAgentId;
    const { searchParams } = new URL(request.url);

    const filter = (searchParams.get('filter') || 'all').toLowerCase();
    if (!(filter in TYPE_BY_FILTER)) {
      return NextResponse.json({ error: 'Invalid filter' }, { status: 400 });
    }
    const cursor = searchParams.get('cursor');
    const limit = parseLimit(searchParams.get('limit'));

    const where: any = { travelAgentId };
    if (filter === 'unread') where.isRead = false;
    const typedFilter = TYPE_BY_FILTER[filter];
    if (typedFilter) where.type = typedFilter;

    const items = await prisma.travel_agent_notifications.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,                                  // fetch one extra to detect "more"
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;

    const unreadCount = await prisma.travel_agent_notifications.count({
      where: { travelAgentId, isRead: false },
    });

    // Per-type totals for the filter row — lets the UI show "Leads (12)"
    // etc. without a separate round trip per tab.
    const typeCountRows = await prisma.travel_agent_notifications.groupBy({
      by: ['type'],
      where: { travelAgentId },
      _count: { _all: true },
    });
    const totalCount = await prisma.travel_agent_notifications.count({ where: { travelAgentId } });
    const typeCounts: Record<string, number> = { all: totalCount, unread: unreadCount };
    for (const row of typeCountRows) {
      typeCounts[row.type.toLowerCase()] = row._count._all;
    }

    return NextResponse.json({
      items: page.map(projectItem),
      nextCursor: hasMore ? page[page.length - 1].id : null,
      unreadCount,
      typeCounts,
    });
  } catch (error: any) {
    logger.error('GET /api/travel-agent/notifications', error);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const travelAgentId = auth.travelAgentId;
    const body = await request.json();
    const action = body.action;

    if (action === 'markAllRead') {
      const result = await prisma.travel_agent_notifications.updateMany({
        where: { travelAgentId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      return NextResponse.json({ updated: result.count });
    }

    if (action === 'markRead') {
      const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
      if (ids.length === 0) {
        return NextResponse.json({ error: 'ids required' }, { status: 400 });
      }
      const result = await prisma.travel_agent_notifications.updateMany({
        where: { travelAgentId, id: { in: ids }, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      return NextResponse.json({ updated: result.count });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    logger.error('PATCH /api/travel-agent/notifications', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const travelAgentId = auth.travelAgentId;
    const body = await request.json();

    if (body.all === true) {
      const result = await prisma.travel_agent_notifications.deleteMany({
        where: { travelAgentId },
      });
      return NextResponse.json({ deleted: result.count });
    }

    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: 'ids or all=true required' }, { status: 400 });
    }
    const result = await prisma.travel_agent_notifications.deleteMany({
      where: { travelAgentId, id: { in: ids } },
    });
    return NextResponse.json({ deleted: result.count });
  } catch (error: any) {
    logger.error('DELETE /api/travel-agent/notifications', error);
    return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
  }
}
