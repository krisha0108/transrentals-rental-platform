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

// POST - Create a new article
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const service = await prisma.services.findFirst({
      where: { slug },
      select: { id: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const settingKey = getSettingKey(slug);
    const existing = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    const data = (existing?.value as any) || { articles: [], categories: [] };

    const newArticle = {
      id: Math.random().toString(36).substr(2, 9),
      title: body.title,
      slug: body.slug,
      content: body.content,
      category: body.chauffeur_vehicle_categories || '',
      status: body.status || 'draft',
      order: data.articles.length,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.articles.push(newArticle);

    await prisma.settings.upsert({
      where: { key: settingKey },
      create: { id: generateId(), key: settingKey, value: data },
      update: { value: data },
    });

    return NextResponse.json({ success: true, article: newArticle });
  } catch (error) {
    logger.error('Failed to create article', error);
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }
}
