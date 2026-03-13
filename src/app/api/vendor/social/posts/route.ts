import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const categoryId = searchParams.get('categoryId');
    const type = searchParams.get('type'); // 'feed' | 'sos' | 'saved' | 'my'

    // SOS stories (separate from feed)
    if (type === 'sos') {
      const sosCategoryIds = await prisma.social_categories.findMany({
        where: { isSOS: true, isActive: true },
        select: { id: true },
      });
      const sosIds = sosCategoryIds.map((c) => c.id);
      if (!sosIds.length) return NextResponse.json({ posts: [] });

      // Get recent SOS posts (last 24h), grouped by vendor (max 1 per vendor for story display)
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const sosPosts = await prisma.social_posts.findMany({
        where: { categoryId: { in: sosIds }, isActive: true, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: { select: { id: true, businessName: true, ownerName: true, logo: true, city: true } },
          category: { select: { id: true, name: true, isSOS: true } },
          _count: { select: { social_post_likes: true, social_post_comments: true } },
        },
      });
      return NextResponse.json({ posts: sosPosts });
    }

    // Saved posts
    if (type === 'saved') {
      const saves = await prisma.social_post_saves.findMany({
        where: { vendorId },
        orderBy: { createdAt: 'desc' },
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        take: PAGE_SIZE,
        include: {
          post: {
            include: {
              vendor: { select: { id: true, businessName: true, ownerName: true, logo: true, city: true } },
              category: { select: { id: true, name: true, isSOS: true } },
              _count: { select: { social_post_likes: true, social_post_comments: true } },
              social_post_likes: { where: { vendorId }, select: { id: true } },
              social_post_saves: { where: { vendorId }, select: { id: true } },
            },
          },
        },
      });
      const posts = saves.map((s) => ({
        ...s.post,
        likedByMe: s.post.social_post_likes.length > 0,
        savedByMe: true,
        likesCount: s.post._count.social_post_likes,
        commentsCount: s.post._count.social_post_comments,
      }));
      const nextCursor = saves.length === PAGE_SIZE ? saves[saves.length - 1].id : null;
      return NextResponse.json({ posts, nextCursor });
    }

    // My posts
    if (type === 'my') {
      const posts = await prisma.social_posts.findMany({
        where: { vendorId, isActive: true },
        orderBy: { createdAt: 'desc' },
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        take: PAGE_SIZE,
        include: {
          vendor: { select: { id: true, businessName: true, ownerName: true, logo: true, city: true } },
          category: { select: { id: true, name: true, isSOS: true } },
          _count: { select: { social_post_likes: true, social_post_comments: true } },
          social_post_likes: { where: { vendorId }, select: { id: true } },
          social_post_saves: { where: { vendorId }, select: { id: true } },
        },
      });
      const enriched = posts.map((p) => ({
        ...p,
        likedByMe: p.social_post_likes.length > 0,
        savedByMe: p.social_post_saves.length > 0,
        likesCount: p._count.social_post_likes,
        commentsCount: p._count.social_post_comments,
      }));
      const nextCursor = posts.length === PAGE_SIZE ? posts[posts.length - 1].id : null;
      return NextResponse.json({ posts: enriched, nextCursor });
    }

    // Main feed
    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId;

    const posts = await prisma.social_posts.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: PAGE_SIZE,
      include: {
        vendor: { select: { id: true, businessName: true, ownerName: true, logo: true, city: true } },
        category: { select: { id: true, name: true, isSOS: true } },
        _count: { select: { social_post_likes: true, social_post_comments: true } },
        social_post_likes: { where: { vendorId }, select: { id: true } },
        social_post_saves: { where: { vendorId }, select: { id: true } },
      },
    });

    // Batch-fetch follow status for all unique vendor IDs in this page
    const uniqueVendorIds = [...new Set(posts.map((p) => p.vendorId).filter((id) => id !== vendorId))];
    const follows = uniqueVendorIds.length
      ? await prisma.social_follows.findMany({
          where: { followerId: vendorId, followingId: { in: uniqueVendorIds } },
          select: { followingId: true },
        })
      : [];
    const followingSet = new Set(follows.map((f) => f.followingId));

    const enriched = posts.map((p) => ({
      ...p,
      likedByMe: p.social_post_likes.length > 0,
      savedByMe: p.social_post_saves.length > 0,
      likesCount: p._count.social_post_likes,
      commentsCount: p._count.social_post_comments,
      followedByMe: followingSet.has(p.vendorId),
    }));

    const nextCursor = posts.length === PAGE_SIZE ? posts[posts.length - 1].id : null;
    return NextResponse.json({ posts: enriched, nextCursor });
  } catch (error: any) {
    logger.error('Get social posts error', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }
    const vendorId = auth.vendorId;

    const { content, categoryId } = await request.json();
    if (!content?.trim()) return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    if (!categoryId) return NextResponse.json({ error: 'Category is required' }, { status: 400 });

    const category = await prisma.social_categories.findUnique({ where: { id: categoryId } });
    if (!category || !category.isActive) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const post = await prisma.social_posts.create({
      data: { vendorId, categoryId, content: content.trim() },
      include: {
        vendor: { select: { id: true, businessName: true, ownerName: true, logo: true, city: true } },
        category: { select: { id: true, name: true, isSOS: true } },
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error: any) {
    logger.error('Create social post error', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
