// @ts-nocheck
//
// Unified auth resolver for the Social Network. Tries vendor auth first,
// then travel-agent auth. Returns a SocialActor object the service layer
// uses to author posts/likes/comments and to enforce ownership.
//
// Both vendors and travel agents can sit on the same feed, but at the
// DB level a row is keyed by EITHER `vendorId` OR `agentId` — never both.
// `actor.type` tells the service which column to write.

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from './vendor-mobile-auth';
import { getTravelAgentAuth } from './travel-agent-auth';

export type SocialActor =
  | {
      type: 'vendor';
      id: string;
      displayName: string;
      ownerName: string | null;
      logo: string | null;
      city: string | null;
    }
  | {
      type: 'agent';
      id: string;
      displayName: string;
      ownerName: string | null;
      logo: string | null;
      city: string | null;
    };

export interface SocialAuthResult {
  actor: SocialActor | null;
  error?: string;
}

export async function getSocialAuth(request: NextRequest): Promise<SocialAuthResult> {
  // ── Vendor first (most common) ─────────────────────────────────────────────
  const v = await getVendorAuth(request);
  if (v.authenticated && v.vendorId) {
    const vendor = await prisma.vendors.findUnique({
      where: { id: v.vendorId },
      select: { id: true, businessName: true, ownerName: true, logo: true, city: true },
    });
    if (vendor) {
      return {
        actor: {
          type: 'vendor',
          id: vendor.id,
          displayName: vendor.businessName,
          ownerName: vendor.ownerName ?? null,
          logo: vendor.logo ?? null,
          city: vendor.city ?? null,
        },
      };
    }
  }

  // ── Travel agent ───────────────────────────────────────────────────────────
  const a = await getTravelAgentAuth(request);
  if (a.authenticated && a.travelAgentId) {
    const agent = await prisma.travel_agents.findUnique({
      where: { id: a.travelAgentId },
      select: { id: true, agencyName: true, ownerName: true, logo: true, city: true, status: true },
    });
    if (agent) {
      // Block disallowed states from authoring/interacting
      if (['BLOCKED', 'SUSPENDED', 'REJECTED'].includes(agent.status)) {
        return { actor: null, error: 'Account not allowed to post' };
      }
      return {
        actor: {
          type: 'agent',
          id: agent.id,
          displayName: agent.agencyName,
          ownerName: agent.ownerName ?? null,
          logo: agent.logo ?? null,
          city: agent.city ?? null,
        },
      };
    }
  }

  return { actor: null, error: 'Unauthorized' };
}

// Helper: build the where clause that matches an actor on social_* rows.
// Use as: where: { ...whereActorOwns(actor), ... }
export function whereActorOwns(actor: SocialActor) {
  return actor.type === 'vendor'
    ? { vendorId: actor.id }
    : { agentId: actor.id };
}

// Helper: build the data payload to set the actor as the author on insert.
export function actorAuthorData(actor: SocialActor) {
  return actor.type === 'vendor'
    ? { vendorId: actor.id, agentId: null }
    : { vendorId: null, agentId: actor.id };
}
