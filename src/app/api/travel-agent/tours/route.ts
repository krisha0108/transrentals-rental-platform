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
    .slice(0, 60);
}

// Per-agent slug uniqueness (agent can have a "goa-3-day" tour even if another agent has one)
async function uniqueSlugForAgent(travelAgentId: string, base: string): Promise<string> {
  let attempt = base || 'tour';
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.travel_agent_tours.findFirst({
      where: { travelAgentId, slug: attempt },
      select: { id: true },
    });
    if (!exists) return attempt;
    attempt = `${base}-${crypto.randomBytes(2).toString('hex')}`;
  }
  return `${base}-${crypto.randomBytes(4).toString('hex')}`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const isActive = searchParams.get('isActive');
    const isPublic = searchParams.get('isPublic');

    const where: any = { travelAgentId: auth.travelAgentId };
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;
    if (isPublic === 'true') where.isPublic = true;
    if (isPublic === 'false') where.isPublic = false;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { destination: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const tours = await prisma.travel_agent_tours.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const stats = {
      total: tours.length,
      active: tours.filter((t) => t.isActive).length,
      published: tours.filter((t) => t.isPublic).length,
    };

    return NextResponse.json({ tours, stats });
  } catch (error: any) {
    logger.error('List travel agent tours error', error);
    return NextResponse.json(
      { error: 'Failed to fetch tours', details: error?.message },
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
    const {
      title,
      description,
      destination,
      durationDays,
      durationNights,
      startingPrice,
      inclusions,
      exclusions,
      itinerary,
      termsConditions,
      coverImage,
      galleryImages,
      vehicleIds,
      category,
    } = body;

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!destination || !String(destination).trim()) {
      return NextResponse.json({ error: 'Destination is required' }, { status: 400 });
    }

    const baseSlug = slugify(String(title));
    const slug = await uniqueSlugForAgent(auth.travelAgentId, baseSlug);

    const tour = await prisma.travel_agent_tours.create({
      data: {
        travelAgentId: auth.travelAgentId,
        title: String(title).trim(),
        slug,
        description: description || null,
        destination: String(destination).trim(),
        durationDays: durationDays ? Number(durationDays) : 1,
        durationNights: durationNights ? Number(durationNights) : 0,
        startingPrice: startingPrice ? Number(startingPrice) : null,
        inclusions: inclusions || null,
        exclusions: exclusions || null,
        itinerary: itinerary || null,
        termsConditions: termsConditions || null,
        coverImage: coverImage || null,
        galleryImages: galleryImages || null,
        vehicleIds: vehicleIds || null,
        category: category || null,
        isActive: true,
        isPublic: false, // requires approved status to publish — toggled separately
      } as any,
    });

    return NextResponse.json({ tour }, { status: 201 });
  } catch (error: any) {
    logger.error('Create travel agent tour error', error);
    return NextResponse.json(
      { error: 'Failed to create tour', details: error?.message },
      { status: 500 },
    );
  }
}
