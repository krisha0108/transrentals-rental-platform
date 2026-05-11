import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.travel_agent_lead_capture_links.findUnique({ where: { id } });
    if (!existing || existing.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Capture link not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, defaultTripType, isActive } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = String(title).trim();
    if (description !== undefined) updateData.description = description || null;
    if (defaultTripType !== undefined) updateData.defaultTripType = defaultTripType || null;
    if (isActive !== undefined) updateData.isActive = !!isActive;

    const updated = await prisma.travel_agent_lead_capture_links.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ link: updated });
  } catch (error: any) {
    logger.error('Update capture link error', error);
    return NextResponse.json(
      { error: 'Failed to update capture link', details: error?.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.travel_agent_lead_capture_links.findUnique({ where: { id } });
    if (!existing || existing.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Capture link not found' }, { status: 404 });
    }

    // Hard-delete; existing leads keep `captureLinkId` set to null via FK ON DELETE SET NULL
    await prisma.travel_agent_lead_capture_links.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Delete capture link error', error);
    return NextResponse.json(
      { error: 'Failed to delete capture link', details: error?.message },
      { status: 500 },
    );
  }
}
