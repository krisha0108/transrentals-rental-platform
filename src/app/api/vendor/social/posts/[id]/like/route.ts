import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;
    const resolvedParams = 'then' in params ? await params : params;
    const postId = resolvedParams.id;

    const existing = await prisma.social_post_likes.findUnique({
      where: { postId_vendorId: { postId, vendorId } },
    });

    if (existing) {
      await prisma.social_post_likes.delete({ where: { postId_vendorId: { postId, vendorId } } });
      const count = await prisma.social_post_likes.count({ where: { postId } });
      return NextResponse.json({ liked: false, likesCount: count });
    } else {
      await prisma.social_post_likes.create({ data: { postId, vendorId } });
      const count = await prisma.social_post_likes.count({ where: { postId } });
      return NextResponse.json({ liked: true, likesCount: count });
    }
  } catch (error: any) {
    logger.error('Toggle like error', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
