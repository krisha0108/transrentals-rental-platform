import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { transformPrismaResponse } from '@/lib/utils/api-transform';
import crypto from 'crypto';

import logger from '@/lib/security/logger';

// Helper to generate a cuid-like unique ID
function generateId(): string {
  return 'c' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}
const getSettingKey = (slug: string) => `service_redirects_${slug}`;

// GET - Fetch all redirects for a service
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

    const data = (setting?.value as any) || { redirects: [] };

    return NextResponse.json({
      serviceName: service.name,
      redirects: data.redirects || [],
    });
  } catch (error) {
    logger.error('Failed to fetch redirects', error);
    return NextResponse.json({ error: 'Failed to fetch redirects' }, { status: 500 });
  }
}

// POST - Create a new redirect
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

    const data = (existing?.value as any) || { redirects: [] };

    const newRedirect = {
      id: Math.random().toString(36).substr(2, 9),
      source: body.source,
      destination: body.destination,
      type: body.type || '301',
      isActive: body.isActive !== false,
      hits: 0,
      createdAt: new Date().toISOString(),
    };

    data.redirects.push(newRedirect);

    await prisma.settings.upsert({
      where: { key: settingKey },
      create: { id: generateId(), key: settingKey, value: data },
      update: { value: data },
    });

    return NextResponse.json({ success: true, redirect: newRedirect });
  } catch (error) {
    logger.error('Failed to create redirect', error);
    return NextResponse.json({ error: 'Failed to create redirect' }, { status: 500 });
  }
}
