import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import logger from '@/lib/security/logger';

function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

function calcReadTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, '');
  return Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
}

// GET - Fetch single post for editing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const post = await prisma.blog_posts.findUnique({
      where: { id },
      include: {
        blog_categories: { select: { id: true, name: true, slug: true } },
        admin_users: { select: { id: true, name: true, email: true } },
        seo_meta: true,
      },
    });

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    return NextResponse.json({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      status: post.status,
      featuredImage: post.featuredImage,
      publishedAt: post.publishedAt?.toISOString() || null,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      viewCount: post.viewCount,
      readTime: post.readTime,
      category: post.blog_categories,
      categoryId: post.categoryId,
      author: post.admin_users,
      tags: post.tags ? JSON.parse(post.tags) : [],
      seo: post.seo_meta,
    });
  } catch (error) {
    logger.error('Failed to fetch blog post', error);
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
}

// PATCH - Update a blog post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.blog_posts.findUnique({
      where: { id },
      include: { seo_meta: true },
    });

    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // Check slug uniqueness if changed
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await prisma.blog_posts.findUnique({ where: { slug: body.slug } });
      if (slugExists) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    const isNowPublished = body.status === 'PUBLISHED';
    const wasPublished = existing.status === 'PUBLISHED';

    const updated = await prisma.blog_posts.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title.trim() }),
        ...(body.slug && { slug: body.slug.trim() }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.excerpt !== undefined && { excerpt: body.excerpt?.trim() || null }),
        ...(body.featuredImage !== undefined && { featuredImage: body.featuredImage || null }),
        ...(body.status && { status: body.status }),
        ...(isNowPublished && !wasPublished && { publishedAt: new Date() }),
        ...(!isNowPublished && wasPublished && body.status === 'DRAFT' && { publishedAt: null }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
        ...(body.tags !== undefined && { tags: body.tags?.length ? JSON.stringify(body.tags) : null }),
        ...(body.content !== undefined && { readTime: calcReadTime(body.content) }),
      } as any,
    });

    // Upsert SEO meta
    if (body.seo) {
      const seoData = {
        metaTitle: body.seo.metaTitle || body.title || existing.title,
        metaDescription: body.seo.metaDescription || null,
        metaKeywords: body.seo.metaKeywords || null,
        ogTitle: body.seo.ogTitle || body.title || existing.title,
        ogDescription: body.seo.ogDescription || null,
        ogImage: body.seo.ogImage || body.featuredImage || existing.featuredImage || null,
        ogType: 'article',
        twitterCard: 'summary_large_image',
        twitterTitle: body.seo.metaTitle || body.title || existing.title,
        twitterDescription: body.seo.metaDescription || null,
        twitterImage: body.seo.ogImage || body.featuredImage || null,
        canonicalUrl: body.seo.canonicalUrl || null,
        noindex: body.seo.noindex ?? false,
        nofollow: body.seo.nofollow ?? false,
      };

      if (existing.seo_meta) {
        await prisma.seo_meta.update({ where: { blogPostId: id }, data: seoData });
      } else {
        await prisma.seo_meta.create({
          data: { id: generateId(), blogPostId: id, ...seoData },
        });
      }
    }

    return NextResponse.json({ success: true, post: { id: updated.id, slug: updated.slug } });
  } catch (error) {
    logger.error('Failed to update blog post', error);
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
  }
}

// DELETE - Delete a blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const post = await prisma.blog_posts.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // Delete seo_meta first (cascade should handle it but being explicit)
    await prisma.seo_meta.deleteMany({ where: { blogPostId: id } });
    await prisma.blog_posts.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete blog post', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
