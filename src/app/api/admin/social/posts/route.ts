// GET ?platform=FACEBOOK|INSTAGRAM&accountId=&limit= — the synced post feed
// with engagement metrics, newest first, for the /admin/social dashboard.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const admin = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
    if (!admin || !['SUPER_ADMIN', 'ADMIN'].includes(admin.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const accountId = searchParams.get('accountId');
    const limitRaw = Number(searchParams.get('limit'));
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(200, Math.floor(limitRaw)) : 50;

    const where: any = {};
    if (platform === 'FACEBOOK' || platform === 'INSTAGRAM') where.platform = platform;
    if (accountId) where.accountId = accountId;

    const posts = await prisma.social_media_posts.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: limit,
      include: {
        account: { select: { id: true, pageName: true, igUsername: true, profilePictureUrl: true } },
      },
    });

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    logger.error('Failed to list social media posts', error);
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 });
  }
}
