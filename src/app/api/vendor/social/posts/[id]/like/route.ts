// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { SocialActor } from '@/lib/auth/social-auth';
import { togglePostLike, SocialError } from '@/lib/social/service';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

async function vendorActor(request: NextRequest): Promise<SocialActor | null> {
  const auth = await getVendorAuth(request);
  if (!auth.authenticated || !auth.vendorId) return null;
  const vendor = await prisma.vendors.findUnique({
    where: { id: auth.vendorId },
    select: { id: true, businessName: true, ownerName: true, logo: true, city: true },
  });
  if (!vendor) return null;
  return {
    type: 'vendor',
    id: vendor.id,
    displayName: vendor.businessName,
    ownerName: vendor.ownerName ?? null,
    logo: vendor.logo ?? null,
    city: vendor.city ?? null,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const actor = await vendorActor(request);
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolved = 'then' in params ? await params : params;
    const result = await togglePostLike(actor, resolved.id);
    return NextResponse.json(result);
  } catch (e: any) {
    if (e instanceof SocialError) return NextResponse.json({ error: e.message }, { status: e.status });
    logger.error('POST /api/vendor/social/posts/[id]/like', e);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
