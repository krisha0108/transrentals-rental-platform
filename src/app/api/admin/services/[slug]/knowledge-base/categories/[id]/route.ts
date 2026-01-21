import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
const getSettingKey = (slug: string) => `service_knowledge_base_${slug}`;

// PATCH - Update a category
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
    const categoryIndex = data.categories.findIndex((c: any) => c.id === id);

    if (categoryIndex === -1) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const oldSlug = data.categories[categoryIndex].slug;
    const newSlug = body.slug || oldSlug;

    // Update category
    data.categories[categoryIndex] = {
      ...data.categories[categoryIndex],
      ...body,
    };

    // Update articles with this category if slug changed
    if (oldSlug !== newSlug) {
      data.articles = data.articles.map((a: any) =>
        a.chauffeur_vehicle_categories === oldSlug ? { ...a, category: newSlug } : a
      );
    }

    await prisma.settings.update({
      where: { key: settingKey },
      data: { value: data },
    });

    return NextResponse.json({ success: true, category: data.categories[categoryIndex] });
  } catch (error) {
    logger.error('Failed to update category', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE - Delete a category
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
    const category = data.categories.find((c: any) => c.id === id);

    if (category) {
      // Move articles to uncategorized
      data.articles = data.articles.map((a: any) =>
        a.chauffeur_vehicle_categories === category.slug ? { ...a, category: '' } : a
      );
    }

    data.categories = data.categories.filter((c: any) => c.id !== id);

    await prisma.settings.update({
      where: { key: settingKey },
      data: { value: data },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete category', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
