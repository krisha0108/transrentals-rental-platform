import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

import logger from '@/lib/security/logger';
export const dynamic = 'force-dynamic';

// GET all settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.settings.findMany();

    // Convert to key-value object
    const settingsObject: Record<string, string> = {};
    settings.forEach((setting: { key: string; value: string }) => {
      settingsObject[setting.key] = setting.value;
    });

    return NextResponse.json(settingsObject);
  } catch (error) {
    logger.error('Error fetching settings', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST/PUT update settings (bulk update)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Update each setting
    const updates = Object.entries(body).map(([key, value]) => {
      return prisma.settings.upsert({
        where: { key },
        update: { value: String(value) },
        create: {
          key,
          value: String(value),
          type: 'TEXT',
          group: getSettingGroup(key),
          label: formatLabel(key),
        },
      });
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Error updating settings', error);
    return NextResponse.json({ error: 'Failed to update settings', detail: error?.message }, { status: 500 });
  }
}

function getSettingGroup(key: string): string {
  if (key.includes('meta') || key.includes('seo') || key.includes('Meta')) return 'seo';
  if (key.includes('facebook') || key.includes('instagram') || key.includes('twitter') || key.includes('linkedin')) return 'social';
  if (key.includes('contact') || key.includes('email') || key.includes('phone')) return 'contact';
  if (key.includes('google') || key.includes('bing') || key.includes('clarity') || key.includes('hotjar') || key.includes('pixel') || key.includes('Script')) return 'tracking';
  return 'general';
}

function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
