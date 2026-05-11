import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import crypto from 'crypto';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

// Generates a globally-unique slug for the public lead-capture URL.
// Falls back to a random suffix on collision so we don't leak existing slugs.
async function generateUniqueSlug(base: string): Promise<string> {
  let attempt = base || 'lead-form';
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.travel_agent_lead_capture_links.findUnique({
      where: { slug: attempt },
    });
    if (!exists) return attempt;
    attempt = `${base}-${crypto.randomBytes(3).toString('hex')}`;
  }
  // Worst case: pure random
  return `lead-${crypto.randomBytes(6).toString('hex')}`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const links = await prisma.travel_agent_lead_capture_links.findMany({
      where: { travelAgentId: auth.travelAgentId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { travel_agent_leads: true } } },
    });

    return NextResponse.json({
      links: links.map(({ _count, ...rest }) => ({
        ...rest,
        leadsGenerated: _count.travel_agent_leads,
      })),
    });
  } catch (error: any) {
    logger.error('List capture links error', error);
    return NextResponse.json(
      { error: 'Failed to fetch capture links', details: error?.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, defaultTripType } = body;
    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const baseSlug = slugify(String(title));
    const slug = await generateUniqueSlug(baseSlug);

    const link = await prisma.travel_agent_lead_capture_links.create({
      data: {
        travelAgentId: auth.travelAgentId,
        slug,
        title: String(title).trim(),
        description: description || null,
        defaultTripType: defaultTripType || null,
        isActive: true,
      },
    });

    return NextResponse.json({ link }, { status: 201 });
  } catch (error: any) {
    logger.error('Create capture link error', error);
    return NextResponse.json(
      { error: 'Failed to create capture link', details: error?.message },
      { status: 500 },
    );
  }
}
