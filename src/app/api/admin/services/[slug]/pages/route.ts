import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}
const getSettingKey = (slug: string) => `service_pages_${slug}`;

// GET - Fetch all pages for a service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const service = await prisma.services.findFirst({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const setting = await prisma.settings.findUnique({
      where: { key: getSettingKey(slug) },
    });

    const data = (setting?.value as any) || { pages: [] };

    return NextResponse.json({
      serviceName: service.name,
      pages: data.pages || [],
    });
  } catch (error) {
    logger.error('Failed to fetch pages', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}

// POST - Create a new page
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

    const data = (existing?.value as any) || { pages: [] };
    const newPage = {
      id: Math.random().toString(36).substr(2, 9),
      title: body.title,
      slug: body.slug,
      content: body.content,
      template: body.template || 'default',
      status: body.status || 'draft',
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.pages.push(newPage);

    await prisma.settings.upsert({
      where: { key: settingKey },
      create: { id: generateId(), key: settingKey, value: data },
      update: { value: data },
    });

    return NextResponse.json({ success: true, page: newPage });
  } catch (error) {
    logger.error('Failed to create page', error);
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
  }
}
