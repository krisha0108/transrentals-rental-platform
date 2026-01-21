import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
const getSettingKey = (slug: string) => `service_blog_${slug}`;

// PATCH - Update a blog post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id } = await params;
    const body = await request.json();

    const settingKey = getSettingKey(slug);
    const existing = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Blog posts not found' }, { status: 404 });
    }

    const data = existing.value as any;
    const postIndex = data.posts.findIndex((p: any) => p.id === id);

    if (postIndex === -1) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const wasPublished = data.posts[postIndex].status === 'published';
    const isNowPublished = body.status === 'published';

    data.posts[postIndex] = {
      ...data.posts[postIndex],
      ...body,
      tags: body.tags ? body.tags.split(',').map((t: string) => t.trim()) : data.posts[postIndex].tags,
      publishedAt: !wasPublished && isNowPublished ? new Date().toISOString() : data.posts[postIndex].publishedAt,
      updatedAt: new Date().toISOString(),
    };

    await prisma.settings.update({
      where: { key: settingKey },
      data: { value: data },
    });

    return NextResponse.json({ success: true, post: data.posts[postIndex] });
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
    const { slug, id } = await params;

    const settingKey = getSettingKey(slug);
    const existing = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Blog posts not found' }, { status: 404 });
    }

    const data = existing.value as any;
    data.posts = data.posts.filter((p: any) => p.id !== id);

    await prisma.settings.update({
      where: { key: settingKey },
      data: { value: data },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete blog post', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
