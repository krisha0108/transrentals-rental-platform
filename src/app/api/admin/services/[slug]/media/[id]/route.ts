import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';

import logger from '@/lib/security/logger';
const getSettingKey = (slug: string) => `service_media_${slug}`;

// DELETE - Delete a media item
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
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    const data = existing.value ? JSON.parse(existing.value) : { media: [], folders: [] };
    const mediaItem = data.media.find((m: any) => m.id === id);

    if (!mediaItem) {
      return NextResponse.json({ error: 'Media item not found' }, { status: 404 });
    }

    // Update folder count
    if (mediaItem.folder) {
      const folderIndex = data.folders.findIndex((f: any) => f.name === mediaItem.folder);
      if (folderIndex !== -1 && data.folders[folderIndex].itemCount > 0) {
        data.folders[folderIndex].itemCount--;
      }
    }

    data.media = data.media.filter((m: any) => m.id !== id);

    await prisma.settings.update({
      where: { key: settingKey },
      data: { value: JSON.stringify(data) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete media', error);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}
