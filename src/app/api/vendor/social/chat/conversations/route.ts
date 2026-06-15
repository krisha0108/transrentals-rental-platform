// @ts-nocheck
//
// Vendor-side chat conversations endpoint. Thin wrapper that maps the vendor
// session into a SocialActor and delegates to the shared chat service.
// Response shape unchanged so the existing vendor messages UI keeps working.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { SocialActor } from '@/lib/auth/social-auth';
import { listConversations, getOrCreateConversation, ChatError } from '@/lib/social/chat-service';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

async function vendorActor(request: NextRequest): Promise<SocialActor | null> {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) return null;
  const vendor = await prisma.vendors.findUnique({
    where: { id: auth.vendorId },
    select: { id: true, businessName: true, ownerName: true, logo: true, city: true, status: true },
  });
  if (!vendor) return null;
  if (vendor.status === 'REJECTED' || vendor.status === 'SUSPENDED' || vendor.status === 'BLOCKED') return null;
  return {
    type: 'vendor',
    id: vendor.id,
    displayName: vendor.businessName,
    ownerName: vendor.ownerName ?? null,
    logo: vendor.logo ?? null,
    city: vendor.city ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const actor = await vendorActor(request);
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const result = await listConversations(actor);
    return NextResponse.json(result);
  } catch (e: any) {
    if (e instanceof ChatError) return NextResponse.json({ error: e.message }, { status: e.status });
    logger.error('GET /api/vendor/social/chat/conversations', e);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// Legacy body shape: { otherVendorId }. Also accept the new
// { otherType, otherId } for forwards compat.
export async function POST(request: NextRequest) {
  try {
    const actor = await vendorActor(request);
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    let otherType: 'vendor' | 'agent' | null = body.otherType ?? null;
    let otherId: string | null = body.otherId ?? null;
    if (!otherId && body.otherVendorId) { otherType = 'vendor'; otherId = body.otherVendorId; }
    if (!otherId && body.otherAgentId)  { otherType = 'agent';  otherId = body.otherAgentId; }
    if (!otherType || !otherId) {
      return NextResponse.json({ error: 'otherVendorId required' }, { status: 400 });
    }
    const result = await getOrCreateConversation(actor, { type: otherType, id: otherId });
    return NextResponse.json(result);
  } catch (e: any) {
    if (e instanceof ChatError) return NextResponse.json({ error: e.message }, { status: e.status });
    logger.error('POST /api/vendor/social/chat/conversations', e);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
