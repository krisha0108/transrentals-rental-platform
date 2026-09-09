// GET — list connected Facebook Pages / linked Instagram accounts for the
// /admin/social dashboard (never returns the raw access token).

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { isMetaAppConfigured } from '@/lib/social/meta-graph';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const admin = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
  if (!admin || !['SUPER_ADMIN', 'ADMIN'].includes(admin.role)) return null;
  return admin;
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const accounts = await prisma.social_media_accounts.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        platform: true,
        pageId: true,
        pageName: true,
        igBusinessAccountId: true,
        igUsername: true,
        profilePictureUrl: true,
        followerCount: true,
        isActive: true,
        lastSyncedAt: true,
        lastSyncError: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({
      success: true,
      configured: isMetaAppConfigured(),
      accounts: accounts.map((a) => ({ ...a, postCount: a._count.posts, _count: undefined })),
    });
  } catch (error) {
    logger.error('Failed to list social media accounts', error);
    return NextResponse.json({ error: 'Failed to load connected accounts' }, { status: 500 });
  }
}
