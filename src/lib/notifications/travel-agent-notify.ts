// Notification writer for travel agents. Call this from event sites
// (payment verified, new lead, etc.) to drop a row into the agent's inbox.
// Reads happen through /api/travel-agent/notifications.
//
// Failures are swallowed — notifications are auxiliary, never block the
// primary action. Each failure is logged for observability.

import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

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
}
