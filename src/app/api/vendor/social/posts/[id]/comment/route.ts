import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const resolvedParams = 'then' in params ? await params : params;
    const postId = resolvedParams.id;

    const comments = await prisma.social_post_comments.findMany({
      where: { postId, isActive: true },
      orderBy: { createdAt: 'asc' },
      include: { vendor: { select: { id: true, businessName: true, ownerName: true, logo: true } } },
    });
    return NextResponse.json({ comments });
  } catch (error: any) {
    logger.error('Get comments error', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

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

    const { content } = await request.json();
    if (!content?.trim()) return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });

    const post = await prisma.social_posts.findUnique({ where: { id: postId } });
    if (!post || !post.isActive) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const comment = await prisma.social_post_comments.create({
      data: { postId, vendorId, content: content.trim() },
      include: { vendor: { select: { id: true, businessName: true, ownerName: true, logo: true } } },
    });
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error: any) {
    logger.error('Create comment error', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
