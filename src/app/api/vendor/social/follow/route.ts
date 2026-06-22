import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

// POST /api/vendor/social/follow  { followingId }  → toggle follow/unfollow
export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId!;

    // Block rejected/suspended/blocked vendors from write operations
    const guard = await vendorStatusGuard(vendorId);
    if (guard.blocked) return guard.response;
    const followerId = vendorId;
    const { followingId } = await request.json();

    if (!followingId) return NextResponse.json({ error: 'followingId required' }, { status: 400 });
    if (followerId === followingId) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });

    const existing = await prisma.social_follows.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existing) {
      await prisma.social_follows.delete({ where: { followerId_followingId: { followerId, followingId } } });
      const followersCount = await prisma.social_follows.count({ where: { followingId } });
      return NextResponse.json({ following: false, followersCount });
    } else {
      await prisma.social_follows.create({ data: { followerId, followingId } });
      const followersCount = await prisma.social_follows.count({ where: { followingId } });
      return NextResponse.json({ following: true, followersCount });
    }
  } catch (error: any) {
    logger.error('Follow toggle error', error);
    return NextResponse.json({ error: 'Failed to update follow' }, { status: 500 });
  }
}
