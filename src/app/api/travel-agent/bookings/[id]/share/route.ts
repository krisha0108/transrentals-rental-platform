import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import crypto from 'crypto';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// Generate a URL-safe random token
function generateShareToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

// POST: generate (or refresh) a share token for this booking
//   body: { expiresInDays?: number = 7 }
// Sets booking status to PENDING_CUSTOMER if currently DRAFT.
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
    const booking = await prisma.travel_agent_bookings.findUnique({ where: { id } });
    if (!booking || booking.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const expiresInDays = Math.max(1, Math.min(30, Number(body.expiresInDays) || 7));

    // Generate a unique token (vanishingly small collision risk, but retry to be safe)
    let shareToken = generateShareToken();
    for (let i = 0; i < 3; i++) {
      const exists = await prisma.travel_agent_bookings.findUnique({
        where: { shareToken },
        select: { id: true },
      });
      if (!exists) break;
      shareToken = generateShareToken();
    }

    const shareExpiresAt = new Date();
    shareExpiresAt.setDate(shareExpiresAt.getDate() + expiresInDays);

    const updated = await prisma.travel_agent_bookings.update({
      where: { id },
      data: {
        shareToken,
        shareExpiresAt,
        status: booking.status === 'DRAFT' ? 'PENDING_CUSTOMER' : booking.status,
      },
    });

    return NextResponse.json({
      shareToken: updated.shareToken,
      shareExpiresAt: updated.shareExpiresAt,
    });
  } catch (error: any) {
    logger.error('Generate booking share token error', error);
    return NextResponse.json(
      { error: 'Failed to generate share link', details: error?.message },
      { status: 500 },
    );
  }
}

// DELETE: revoke the share token (customer link stops working)
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
    const booking = await prisma.travel_agent_bookings.findUnique({ where: { id } });
    if (!booking || booking.travelAgentId !== auth.travelAgentId) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    await prisma.travel_agent_bookings.update({
      where: { id },
      data: { shareToken: null, shareExpiresAt: null },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Revoke booking share token error', error);
    return NextResponse.json(
      { error: 'Failed to revoke share link', details: error?.message },
      { status: 500 },
    );
  }
}
