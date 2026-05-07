import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// Lists leads by follow-up urgency:
//   - overdue:  nextFollowUp < today
//   - today:    today
//   - upcoming: between tomorrow and +7 days
export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const weekFromNow = new Date(todayStart);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const baseWhere = {
      travelAgentId: auth.travelAgentId,
      status: { notIn: ['BOOKED', 'LOST'] as any },
    };

    const [overdue, today, upcoming] = await Promise.all([
      prisma.travel_agent_leads.findMany({
        where: { ...baseWhere, nextFollowUp: { lt: todayStart, not: null } },
        orderBy: { nextFollowUp: 'asc' },
      }),
      prisma.travel_agent_leads.findMany({
        where: { ...baseWhere, nextFollowUp: { gte: todayStart, lt: tomorrowStart } },
        orderBy: { nextFollowUp: 'asc' },
      }),
      prisma.travel_agent_leads.findMany({
        where: { ...baseWhere, nextFollowUp: { gte: tomorrowStart, lt: weekFromNow } },
        orderBy: { nextFollowUp: 'asc' },
      }),
    ]);

    return NextResponse.json({
      overdue,
      today,
      upcoming,
      counts: {
        overdue: overdue.length,
        today: today.length,
        upcoming: upcoming.length,
      },
    });
  } catch (error: any) {
    logger.error('List follow-ups error', error);
    return NextResponse.json(
      { error: 'Failed to fetch follow-ups', details: error?.message },
      { status: 500 },
    );
  }
}
