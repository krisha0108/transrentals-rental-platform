import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
const getSettingKey = (slug: string) => `service_redirects_${slug}`;

// PATCH - Update a redirect
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
      return NextResponse.json({ error: 'Redirects not found' }, { status: 404 });
    }

    const data = existing.value as any;
    const redirectIndex = data.redirects.findIndex((r: any) => r.id === id);

    if (redirectIndex === -1) {
      return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });
    }

    data.redirects[redirectIndex] = {
      ...data.redirects[redirectIndex],
      ...body,
    };

    await prisma.settings.update({
      where: { key: settingKey },
      data: { value: data },
    });

    return NextResponse.json({ success: true, redirect: data.redirects[redirectIndex] });
  } catch (error) {
    logger.error('Failed to update redirect', error);
    return NextResponse.json({ error: 'Failed to update redirect' }, { status: 500 });
  }
}

// DELETE - Delete a redirect
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
      return NextResponse.json({ error: 'Redirects not found' }, { status: 404 });
    }

    const data = existing.value as any;
    data.redirects = data.redirects.filter((r: any) => r.id !== id);

    await prisma.settings.update({
      where: { key: settingKey },
      data: { value: data },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete redirect', error);
    return NextResponse.json({ error: 'Failed to delete redirect' }, { status: 500 });
  }
}
