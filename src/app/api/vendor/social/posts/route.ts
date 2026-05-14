// @ts-nocheck
//
// Vendor-side social posts endpoint. Thin wrapper around src/lib/social/service.ts
// so the vendor experience and the unified /api/social/* experience are
// guaranteed to behave identically. The response shape stays identical to
// the previous hand-rolled version (the service exposes `vendor` and `author`
// fields).

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { SocialActor } from '@/lib/auth/social-auth';
import { getFeed, createPost, SocialError } from '@/lib/social/service';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

async function vendorActorFromRequest(request: NextRequest): Promise<{ actor: SocialActor | null; status?: number; error?: string }> {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) {
    return { actor: null, status: 401, error: auth.error || 'Unauthorized' };
  }
  const vendor = await prisma.vendors.findUnique({
    where: { id: auth.vendorId },
    select: { id: true, businessName: true, ownerName: true, logo: true, city: true },
  });
  if (!vendor) return { actor: null, status: 401, error: 'Vendor not found' };
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

export async function GET(request: NextRequest) {
  try {
    const { actor, status, error } = await vendorActorFromRequest(request);
    if (!actor) return NextResponse.json({ error }, { status });

    const { searchParams } = new URL(request.url);
    const result = await getFeed(actor, {
      type: searchParams.get('type'),
      cursor: searchParams.get('cursor'),
      categoryId: searchParams.get('categoryId'),
    });
    return NextResponse.json(result);
  } catch (e: any) {
    if (e instanceof SocialError) return NextResponse.json({ error: e.message }, { status: e.status });
    logger.error('GET /api/vendor/social/posts', e);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { actor, status, error } = await vendorActorFromRequest(request);
    if (!actor) return NextResponse.json({ error }, { status });

    const body = await request.json();
    const result = await createPost(actor, { content: body?.content, categoryId: body?.categoryId });
    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    if (e instanceof SocialError) return NextResponse.json({ error: e.message }, { status: e.status });
    logger.error('POST /api/vendor/social/posts', e);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
