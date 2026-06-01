// @ts-nocheck
// FCM token registration for travel agents (mobile push notifications).
// Mirrors /api/vendor/fcm-token — same multi-device pattern (up to 10 tokens
// per agent in `settings` table) plus `travel_agents.fcmToken` kept in sync
// with the latest token for backward compatibility.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const SETTINGS_KEY = (agentId: string) => `travel_agent_fcm_tokens_${agentId}`;
const MAX_TOKENS = 10; // max devices per agent

// POST — Save/update an FCM token for this agent (multi-device aware).
export async function POST(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fcmToken, deviceId } = body;

    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json({ error: 'fcmToken is required' }, { status: 400 });
    }

    const agentId = auth.travelAgentId;
    const key = SETTINGS_KEY(agentId);

    // Load existing tokens
    const existing = await prisma.settings.findUnique({ where: { key } });
    const data = existing?.value
      ? JSON.parse(existing.value as string)
      : { tokens: [] };

    // Remove any prior entry for this token OR this deviceId (de-dup).
    data.tokens = (data.tokens || []).filter(
      (t: any) =>
        t.token !== fcmToken && (!deviceId || t.deviceId !== deviceId)
    );

    // Insert latest at the front so older entries roll off the end.
    data.tokens.unshift({
      token: fcmToken,
      deviceId: deviceId || null,
      updatedAt: new Date().toISOString(),
    });
    data.tokens = data.tokens.slice(0, MAX_TOKENS);

    await prisma.settings.upsert({
      where: { key },
      create: { key, value: JSON.stringify(data) },
      update: { value: JSON.stringify(data) },
    });

    // Keep travel_agents.fcmToken in sync with the most recent token so
    // legacy single-device push code paths still work.
    await prisma.travel_agents.update({
      where: { id: agentId },
      data: { fcmToken },
    });

    logger.info(
      `FCM token saved for travel_agent ${agentId} (${data.tokens.length} devices)`
    );
    return NextResponse.json({
      success: true,
      deviceCount: data.tokens.length,
    });
  } catch (error: any) {
    logger.error('Failed to update travel_agent FCM token', error);
    return NextResponse.json(
      { error: 'Failed to update FCM token' },
      { status: 500 }
    );
  }
}

// DELETE — Remove this device's FCM token (called on logout).
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json(
        { error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { fcmToken, deviceId } = body;

    const agentId = auth.travelAgentId;
    const key = SETTINGS_KEY(agentId);

    // Remove the specific token from the array
    const existing = await prisma.settings.findUnique({ where: { key } });
    if (existing?.value) {
      const data = JSON.parse(existing.value as string);
      data.tokens = (data.tokens || []).filter(
        (t: any) =>
          t.token !== fcmToken && (!deviceId || t.deviceId !== deviceId)
      );
      await prisma.settings.update({
        where: { key },
        data: { value: JSON.stringify(data) },
      });
    }

    // Clear the primary fcmToken column if it matched the removed device.
    const agent = await prisma.travel_agents.findUnique({
      where: { id: agentId },
      select: { fcmToken: true },
    });
    if (agent?.fcmToken === fcmToken) {
      await prisma.travel_agents.update({
        where: { id: agentId },
        data: { fcmToken: null },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Failed to clear travel_agent FCM token', error);
    return NextResponse.json(
      { error: 'Failed to clear FCM token' },
      { status: 500 }
    );
  }
}
