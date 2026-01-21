import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}
const getSettingKey = (slug: string) => `service_blog_${slug}`;

// GET - Fetch all blog posts for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const service = await prisma.services.findFirst({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const setting = await prisma.settings.findUnique({
      where: { key: getSettingKey(slug) },
    });

    const data = (setting?.value as any) || { posts: [] };

    return NextResponse.json({
      serviceName: service.name,
      posts: data.posts || [],
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
    const { slug } = await params;
    const body = await request.json();

    const service = await prisma.services.findFirst({
      where: { slug },
      select: { id: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const settingKey = getSettingKey(slug);
    const existing = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    const data = (existing?.value as any) || { posts: [] };
    const newPost = {
      id: Math.random().toString(36).substr(2, 9),
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt,
      content: body.content,
      category: body.chauffeur_vehicle_categories,
      author: body.author,
      status: body.status || 'draft',
      featuredImage: body.featuredImage,
      tags: body.tags ? body.tags.split(',').map((t: string) => t.trim()) : [],
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      publishedAt: body.status === 'published' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.posts.push(newPost);

    await prisma.settings.upsert({
      where: { key: settingKey },
      create: { id: generateId(), key: settingKey, value: data },
      update: { value: data },
    });

    return NextResponse.json({ success: true, post: newPost });
  } catch (error) {
    logger.error('Failed to create blog post', error);
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}
