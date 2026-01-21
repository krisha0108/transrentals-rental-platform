import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { capitalize } from '@/lib/utils';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

const getSettingKey = (slug: string) => `service_media_${slug}`;

// GET - Fetch all media for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Service doesn't need to exist - use slug to organize media
    const service = await prisma.services.findFirst({
      where: { slug },
      select: { id: true, name: true },
    });

    const setting = await prisma.settings.findUnique({
      where: { key: getSettingKey(slug) },
    });

    const data = setting?.value ? JSON.parse(setting.value) : { media: [], folders: [] };

    return NextResponse.json({
      serviceName: service?.name || capitalize(slug.replace(/-/g, ' ')),
      media: data.media || [],
      folders: data.folders || [],
    });
  } catch (error) {
    logger.error('Failed to fetch media', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

// POST - Add new media
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();

    // Service doesn't need to exist - use slug to organize media
    const settingKey = getSettingKey(slug);
    const existing = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    const data = existing?.value ? JSON.parse(existing.value) : { media: [], folders: [] };

    // Detect file type from URL
    const url = body.url.toLowerCase();
    let type = 'document';
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)/.test(url)) type = 'image';
    else if (/\.(mp4|webm|avi|mov|mkv)/.test(url)) type = 'video';
    else if (/\.(mp3|wav|ogg|aac)/.test(url)) type = 'audio';

    const newMedia = {
      id: Math.random().toString(36).substr(2, 9),
      name: body.name || body.url.split('/').pop(),
      url: body.url,
      type,
      size: body.size || 0,
      folder: body.folder || '',
      createdAt: new Date().toISOString(),
    };

    data.media.push(newMedia);

    // Update folder count
    if (body.folder) {
      const folderIndex = data.folders.findIndex((f: any) => f.name === body.folder);
      if (folderIndex !== -1) {
        data.folders[folderIndex].itemCount++;
      }
    }

    await prisma.settings.upsert({
      where: { key: settingKey },
      create: { id: generateId(), key: settingKey, value: JSON.stringify(data) },
      update: { value: JSON.stringify(data) },
    });

    return NextResponse.json({ success: true, media: newMedia });
  } catch (error) {
    logger.error('Failed to add media', error);
    return NextResponse.json({ error: 'Failed to add media' }, { status: 500 });
  }
}
