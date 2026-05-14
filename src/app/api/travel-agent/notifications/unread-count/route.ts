// @ts-nocheck
//
// Lightweight unread-count endpoint for the bell badge in the header. Polled
// frequently (every ~30s typically), so it avoids the full list query.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const count = await prisma.travel_agent_notifications.count({
      where: { travelAgentId: auth.travelAgentId, isRead: false },
    });

    return NextResponse.json({ count });
  } catch (error: any) {
    logger.error('GET /api/travel-agent/notifications/unread-count', error);
    return NextResponse.json({ error: 'Failed to fetch count' }, { status: 500 });
  }
}
