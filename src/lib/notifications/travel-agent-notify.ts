// Notification writer for travel agents. Call this from event sites
// (payment verified, new lead, etc.) to drop a row into the agent's inbox.
// Reads happen through /api/travel-agent/notifications.
//
// Failures are swallowed — notifications are auxiliary, never block the
// primary action. Each failure is logged for observability.

import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { sendTravelAgentPush } from '@/lib/utils/fcm-helper';

export type TravelAgentNotificationType =
  | 'LEAD'
  | 'PAYMENT'
  | 'BOOKING'
  | 'CHAT'
  | 'SYSTEM';

export interface NotifyTravelAgentInput {
  type: TravelAgentNotificationType;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, any>;
}

/** Build the FCM data payload (string-only values) from a notification input. */
function buildPushData(input: NotifyTravelAgentInput): Record<string, string> {
  const data: Record<string, string> = {
    type: input.type,
    source: 'travel-agent',
  };
  if (input.link) data.link = input.link;
  return data;
}

export async function notifyTravelAgent(
  travelAgentId: string,
  input: NotifyTravelAgentInput,
): Promise<void> {
  try {
    await (prisma as any).travel_agent_notifications.create({
      data: {
        travelAgentId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (error) {
    logger.error('notifyTravelAgent failed', {
      travelAgentId,
      type: input.type,
      error,
    });
  }

  // Fire the phone push separately so a push failure never voids the saved
  // in-app notification (and vice-versa). sendTravelAgentPush swallows its
  // own errors, but guard anyway to stay non-blocking.
  try {
    await sendTravelAgentPush({
      travelAgentId,
      title: input.title,
      body: input.body,
      data: buildPushData(input),
    });
  } catch (error) {
    logger.error('notifyTravelAgent push failed', { travelAgentId, error });
  }
}

export async function notifyTravelAgents(
  travelAgentIds: string[],
  input: NotifyTravelAgentInput,
): Promise<void> {
  if (travelAgentIds.length === 0) return;
  try {
    await (prisma as any).travel_agent_notifications.createMany({
      data: travelAgentIds.map((travelAgentId) => ({
        travelAgentId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      })),
    });
  } catch (error) {
    logger.error('notifyTravelAgents failed', {
      count: travelAgentIds.length,
      type: input.type,
      error,
    });
  }

  // Push to every agent's devices in parallel; individual failures are
  // isolated so one bad token set can't block the rest.
  const pushData = buildPushData(input);
  await Promise.allSettled(
    travelAgentIds.map((travelAgentId) =>
      sendTravelAgentPush({
        travelAgentId,
        title: input.title,
        body: input.body,
        data: pushData,
      }),
    ),
  );
}
