// Manager notification inbox.
//
//   GET   ?filter=all|unread&cursor=<id>&limit=20 → { items, nextCursor, unreadCount }
//   PATCH body: { action: 'markRead' | 'markAllRead', ids?: string[] } → { updated }

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

async function requireManager(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const manager = await prisma.admin_users.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!manager || manager.role !== 'MANAGER') return null;
  return manager.id;
}

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
    const managerId = await requireManager(request);
    if (!managerId) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = (searchParams.get('filter') || 'all').toLowerCase();
    const cursor = searchParams.get('cursor');
    const limit = parseLimit(searchParams.get('limit'));

    const where: any = { managerId };
    if (filter === 'unread') where.isRead = false;

    const items = await prisma.manager_notifications.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = items.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;

    const unreadCount = await prisma.manager_notifications.count({
      where: { managerId, isRead: false },
    });

    return NextResponse.json({
      items: page.map(projectItem),
      nextCursor: hasMore ? page[page.length - 1].id : null,
      unreadCount,
    });
  } catch (error: any) {
    logger.error('GET /api/manager/notifications', error);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const managerId = await requireManager(request);
    if (!managerId) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const body = await request.json();
    const action = body.action;

    if (action === 'markAllRead') {
      const result = await prisma.manager_notifications.updateMany({
        where: { managerId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      return NextResponse.json({ updated: result.count });
    }

    if (action === 'markRead') {
      const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
      if (ids.length === 0) {
        return NextResponse.json({ error: 'ids required' }, { status: 400 });
      }
      const result = await prisma.manager_notifications.updateMany({
        where: { managerId, id: { in: ids }, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
      return NextResponse.json({ updated: result.count });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    logger.error('PATCH /api/manager/notifications', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
