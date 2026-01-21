import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
const getSettingKey = (slug: string) => `service_pages_${slug}`;

// PATCH - Update a page
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
      return NextResponse.json({ error: 'Pages not found' }, { status: 404 });
    }

    const data = existing.value as any;
    const pageIndex = data.pages.findIndex((p: any) => p.id === id);

    if (pageIndex === -1) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    data.pages[pageIndex] = {
      ...data.pages[pageIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await prisma.settings.update({
      where: { key: settingKey },
      data: { value: data },
    });

    return NextResponse.json({ success: true, page: data.pages[pageIndex] });
  } catch (error) {
    logger.error('Failed to update page', error);
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}

// DELETE - Delete a page
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
      return NextResponse.json({ error: 'Pages not found' }, { status: 404 });
    }

    const data = existing.value as any;
    data.pages = data.pages.filter((p: any) => p.id !== id);

    await prisma.settings.update({
      where: { key: settingKey },
      data: { value: data },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete page', error);
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}
