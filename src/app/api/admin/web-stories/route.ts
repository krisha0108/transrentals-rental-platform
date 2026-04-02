import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

function generateId(prefix: string = 'ws'): string {
  return prefix + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// GET - List all stories with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (status === 'published') {
      where.isPublished = true;
      where.isArchived = false;
    } else if (status === 'draft') {
      where.isPublished = false;
      where.isArchived = false;
    } else if (status === 'archived') {
      where.isArchived = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { category: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const [stories, total] = await Promise.all([
      prisma.web_stories.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          slides: { select: { id: true, canvasData: true } },
          reactions: { select: { reactionType: true } },
        },
      }),
      prisma.web_stories.count({ where }),
    ]);

    const formatted = stories.map((s: any) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      description: s.description,
      metaDescription: s.metaDescription,
      coverImage: s.coverImage,
      coverImageSquare: s.coverImageSquare,
      publisherName: s.publisherName,
      publisherLogo: s.publisherLogo,
      category: s.category,
      isPublished: s.isPublished,
      isArchived: s.isArchived,
      displayOrder: s.displayOrder,
      expiresAt: s.expiresAt?.toISOString() || null,
      publishedAt: s.publishedAt?.toISOString() || null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      slideCount: s.slides.length,
      hasTextElement: s.slides.some((slide: any) => {
        if (!slide.canvasData) return false;
        try {
          const data = typeof slide.canvasData === 'string' ? JSON.parse(slide.canvasData) : slide.canvasData;
          const elements = Array.isArray(data) ? data : (data.elements || []);
          return elements.some((e: any) => e.type === 'text' && e.content?.trim());
        } catch { return false; }
      }),
      reactions: {
        HEART: s.reactions.filter((r: any) => r.reactionType === 'HEART').length,
        FIRE: s.reactions.filter((r: any) => r.reactionType === 'FIRE').length,
        THUMBS_UP: s.reactions.filter((r: any) => r.reactionType === 'THUMBS_UP').length,
        total: s.reactions.length,
      },
    }));

    return NextResponse.json({
      stories: formatted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error('Failed to fetch web stories', error);
    return NextResponse.json({ error: 'Failed to fetch web stories' }, { status: 500 });
  }
}

// POST - Create new story
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    let slug = body.slug?.trim() || slugify(body.title.trim());

    // Auto-resolve slug conflicts by appending -2, -3, etc.
    let uniqueSlug = slug;
    let suffix = 1;
    while (await prisma.web_stories.findUnique({ where: { slug: uniqueSlug } })) {
      suffix++;
      uniqueSlug = `${slug}-${suffix}`;
    }
    slug = uniqueSlug;

    const storyId = generateId('ws');

    const story = await prisma.web_stories.create({
      data: {
        id: storyId,
        title: body.title.trim(),
        slug,
        description: body.description?.trim() || null,
        metaDescription: body.metaDescription?.trim() || null,
        coverImage: body.coverImage || null,
        coverImageSquare: body.coverImageSquare || null,
        publisherName: body.publisherName?.trim() || null,
        publisherLogo: body.publisherLogo || null,
        category: body.category?.trim() || null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        displayOrder: body.displayOrder ?? 0,
      },
    });

    // Save targeting fields via raw SQL
    const targetServices = Array.isArray(body.targetServices) && body.targetServices.length > 0
      ? JSON.stringify(body.targetServices) : null;
    const targetLocations = Array.isArray(body.targetLocations) && body.targetLocations.length > 0
      ? JSON.stringify(body.targetLocations) : null;
    await prisma.$executeRawUnsafe(
      'UPDATE web_stories SET targetServices = ?, targetLocations = ? WHERE id = ?',
      targetServices, targetLocations, storyId
    );

    // Save slides if provided
    if (Array.isArray(body.slides) && body.slides.length > 0) {
      // Generate IDs upfront so we can update canvasData via raw SQL
      const slidesWithIds = body.slides.map((slide: any, index: number) => ({
        id: generateId('wss'),
        canvasData: slide.canvasData || null,
        slide, index,
      }));

      // Create slides without canvasData (Prisma client may not have the field if regeneration failed)
      await prisma.web_story_slides.createMany({
        data: slidesWithIds.map(({ id, slide, index }) => ({
          id,
          storyId,
          order: slide.order ?? index,
          duration: slide.duration ?? 7,
          bgType: slide.bgType || 'COLOR',
          bgImage: slide.bgImage || null,
          bgVideo: slide.bgVideo || null,
          bgColor: slide.bgColor || null,
          bgGradient: slide.bgGradient || null,
          heading: slide.heading?.trim() || null,
          headingSize: slide.headingSize || 'LG',
          headingColor: slide.headingColor || '#FFFFFF',
          subtext: slide.subtext?.trim() || null,
          subtextColor: slide.subtextColor || '#FFFFFF',
          textPosition: slide.textPosition || 'BOTTOM',
          textAnimation: slide.textAnimation || 'FADE',
          ctaText: slide.ctaText?.trim() || null,
          ctaUrl: slide.ctaUrl?.trim() || null,
          ctaStyle: slide.ctaStyle || null,
        })),
      });

      // Save canvasData via raw SQL (bypasses Prisma client field awareness)
      for (const { id, canvasData } of slidesWithIds) {
        if (canvasData) {
          await prisma.$executeRawUnsafe(
            'UPDATE web_story_slides SET canvasData = ? WHERE id = ?',
            canvasData, id
          );
        }
      }
    }

    return NextResponse.json({ success: true, story: { id: story.id, slug: story.slug } }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create web story', error);
    return NextResponse.json({ error: 'Failed to create web story' }, { status: 500 });
  }
}
