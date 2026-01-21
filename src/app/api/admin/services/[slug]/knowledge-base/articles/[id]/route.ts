import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
const getSettingKey = (slug: string) => `service_knowledge_base_${slug}`;

// PATCH - Update an article
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
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 });
    }

    const data = existing.value as any;
    const articleIndex = data.articles.findIndex((a: any) => a.id === id);

    if (articleIndex === -1) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    data.articles[articleIndex] = {
      ...data.articles[articleIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await prisma.settings.update({
      where: { key: settingKey },
      data: { value: data },
    });

    return NextResponse.json({ success: true, article: data.articles[articleIndex] });
  } catch (error) {
    logger.error('Failed to update article', error);
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

// DELETE - Delete an article
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
      return NextResponse.json({ error: 'Knowledge base not found' }, { status: 404 });
    }

    const data = existing.value as any;
    data.articles = data.articles.filter((a: any) => a.id !== id);

    await prisma.settings.update({
      where: { key: settingKey },
      data: { value: data },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete article', error);
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
  }
}
