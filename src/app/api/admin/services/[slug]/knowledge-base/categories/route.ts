import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}
const getSettingKey = (slug: string) => `service_knowledge_base_${slug}`;

// POST - Create a new category
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const settingKey = getSettingKey(slug);
    const existing = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    const data = (existing?.value as any) || { articles: [], categories: [] };

    const newCategory = {
      id: Math.random().toString(36).substr(2, 9),
      name: body.name,
      slug: body.slug,
      description: body.description || '',
      order: data.categories.length,
    };

    data.categories.push(newCategory);

    await prisma.settings.upsert({
      where: { key: settingKey },
      create: { id: generateId(), key: settingKey, value: data },
      update: { value: data },
    });

    return NextResponse.json({ success: true, category: newCategory });
  } catch (error) {
    logger.error('Failed to create category', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
