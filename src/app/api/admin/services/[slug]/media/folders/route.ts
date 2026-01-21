import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

const getSettingKey = (slug: string) => `service_media_${slug}`;

// POST - Create a new folder
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

    const settingKey = getSettingKey(slug);
    const existing = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    const data = existing?.value ? JSON.parse(existing.value) : { media: [], folders: [] };

    // Check if folder already exists
    if (data.folders.some((f: any) => f.name === body.name)) {
      return NextResponse.json({ error: 'Folder already exists' }, { status: 400 });
    }

    const newFolder = {
      id: Math.random().toString(36).substr(2, 9),
      name: body.name,
      itemCount: 0,
    };

    data.folders.push(newFolder);

    await prisma.settings.upsert({
      where: { key: settingKey },
      create: { id: generateId(), key: settingKey, value: JSON.stringify(data) },
      update: { value: JSON.stringify(data) },
    });

    return NextResponse.json({ success: true, folder: newFolder });
  } catch (error) {
    logger.error('Failed to create folder', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
