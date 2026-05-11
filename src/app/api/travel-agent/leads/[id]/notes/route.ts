import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const lead = await prisma.travel_agent_leads.findUnique({
      where: { id },
      select: { id: true, travelAgentId: true },
    });
    if (!lead || lead.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const notes = await prisma.travel_agent_lead_notes.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ notes });
  } catch (error: any) {
    logger.error('List lead notes error', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes', details: error?.message },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const lead = await prisma.travel_agent_leads.findUnique({
      where: { id },
      select: { id: true, travelAgentId: true },
    });
    if (!lead || lead.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const body = await request.json();
    const { note, authorName } = body;
    if (!note || !String(note).trim()) {
      return NextResponse.json({ error: 'Note text is required' }, { status: 400 });
    }

    const created = await prisma.travel_agent_lead_notes.create({
      data: {
        leadId: id,
        note: String(note).trim(),
        authorName: authorName || null,
      },
    });

    // Bump lastContactAt so this lead surfaces correctly in follow-ups
    await prisma.travel_agent_leads.update({
      where: { id },
      data: { lastContactAt: new Date() },
    });

    return NextResponse.json({ note: created }, { status: 201 });
  } catch (error: any) {
    logger.error('Create lead note error', error);
    return NextResponse.json(
      { error: 'Failed to add note', details: error?.message },
      { status: 500 },
    );
  }
}
