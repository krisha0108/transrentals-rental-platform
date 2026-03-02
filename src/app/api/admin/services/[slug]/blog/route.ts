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

// GET - Fetch all blog posts for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug } = await params;

    const service = await prisma.services.findFirst({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { serviceSlug: slug };
    if (status) where.status = status.toUpperCase();

    const [posts, total] = await Promise.all([
      prisma.blog_posts.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          blog_categories: { select: { id: true, name: true, slug: true } },
          admin_users: { select: { id: true, name: true, email: true } },
          seo_meta: true,
        },
      }),
      prisma.blog_posts.count({ where }),
    ]);

    const formatted = posts.map((p: any) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      status: p.status,
      featuredImage: p.featuredImage,
      publishedAt: p.publishedAt?.toISOString() || null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      viewCount: p.viewCount,
      readTime: p.readTime,
      category: p.blog_categories,
      author: p.admin_users,
      tags: p.tags ? JSON.parse(p.tags) : [],
      seo: p.seo_meta,
    }));

    return NextResponse.json({
      serviceName: service.name,
      posts: formatted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Failed to fetch blog posts', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}

// POST - Create a new blog post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { slug } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!body.slug?.trim()) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await prisma.blog_posts.findUnique({ where: { slug: body.slug } });
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    // Get admin user
    const adminUser = await prisma.admin_users.findUnique({
      where: { email: session.user?.email as string },
      select: { id: true },
    });
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 403 });
    }

    const postId = generateId();
    const now = new Date();
    const isPublished = body.status === 'PUBLISHED';

    const post = await prisma.blog_posts.create({
      data: {
        id: postId,
        title: body.title.trim(),
        slug: body.slug.trim(),
        content: body.content || '',
        excerpt: body.excerpt?.trim() || null,
        featuredImage: body.featuredImage || null,
        status: isPublished ? 'PUBLISHED' : 'DRAFT',
        publishedAt: isPublished ? now : null,
        readTime: calcReadTime(body.content || ''),
        serviceSlug: slug,
        categoryId: body.categoryId || null,
        authorId: adminUser.id,
        tags: body.tags?.length ? JSON.stringify(body.tags) : null,
      } as any,
    });

    // Create SEO meta
    if (body.seo) {
      await prisma.seo_meta.create({
        data: {
          id: generateId(),
          blogPostId: postId,
          metaTitle: body.seo.metaTitle || body.title,
          metaDescription: body.seo.metaDescription || body.excerpt || null,
          metaKeywords: body.seo.metaKeywords || null,
          ogTitle: body.seo.ogTitle || body.title,
          ogDescription: body.seo.ogDescription || body.excerpt || null,
          ogImage: body.seo.ogImage || body.featuredImage || null,
          ogType: 'article',
          twitterCard: 'summary_large_image',
          twitterTitle: body.seo.metaTitle || body.title,
          twitterDescription: body.seo.metaDescription || body.excerpt || null,
          twitterImage: body.seo.ogImage || body.featuredImage || null,
          canonicalUrl: body.seo.canonicalUrl || null,
          noindex: body.seo.noindex || false,
          nofollow: body.seo.nofollow || false,
        },
      });
    }

    return NextResponse.json({ success: true, post: { id: post.id, slug: post.slug } }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create blog post', error);
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}
