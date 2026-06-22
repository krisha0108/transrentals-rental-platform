import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import { nanoid } from 'nanoid';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// POST — submit a support ticket (travel agent)
export async function POST(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, category, message } = body;

    if (!subject?.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }
    if (!message?.trim() || message.trim().length < 5) {
      return NextResponse.json({ error: 'Please describe your issue' }, { status: 400 });
    }

    const ticketCount = await prisma.helpdesk_tickets.count();
    const ticketNo = `TA-TKT${String(ticketCount + 1).padStart(5, '0')}`;

    const heading = category ? `[${category.toUpperCase()}] ${subject.trim()}` : subject.trim();

    const ticket = await prisma.helpdesk_tickets.create({
      data: {
        id: nanoid(),
        ticketNo,
        travelAgentId: auth.travelAgentId,
        submitterType: 'travel_agent',
        heading,
        problem: message.trim(),
        status: 'OPEN',
        priority: 'NORMAL',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ticket submitted successfully!',
      ticketNo: ticket.ticketNo,
    });
  } catch (error: any) {
    logger.error('Travel agent support ticket error', error);
    return NextResponse.json({ error: 'Failed to submit ticket' }, { status: 500 });
  }
}

// GET — list this agent's own tickets
export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tickets = await prisma.helpdesk_tickets.findMany({
      where: { travelAgentId: auth.travelAgentId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        ticketNo: true,
        heading: true,
        status: true,
        priority: true,
        resolution: true,
        createdAt: true,
        resolvedAt: true,
      },
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error: any) {
    logger.error('Travel agent support GET error', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}
