import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

function generateId(prefix: string = 'wss'): string {
  return prefix + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

// GET - Single story with all slides and reaction counts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const story = await prisma.web_stories.findUnique({
      where: { id },
      include: {
        slides: { orderBy: { order: 'asc' } },
        reactions: { select: { reactionType: true } },
      },
    });

    if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

    // Read targeting fields via raw SQL
    const [targeting] = await prisma.$queryRawUnsafe<any[]>(
      'SELECT targetServices, targetLocations FROM web_stories WHERE id = ?', story.id
    );

    return NextResponse.json({
      id: story.id,
      title: story.title,
      slug: story.slug,
      description: story.description,
      metaDescription: story.metaDescription,
      coverImage: story.coverImage,
      coverImageSquare: story.coverImageSquare,
      publisherName: story.publisherName,
      publisherLogo: story.publisherLogo,
      category: story.category,
      isPublished: story.isPublished,
      isArchived: story.isArchived,
      displayOrder: story.displayOrder,
      expiresAt: story.expiresAt?.toISOString() || null,
      publishedAt: story.publishedAt?.toISOString() || null,
      createdAt: story.createdAt.toISOString(),
      updatedAt: story.updatedAt.toISOString(),
      targetServices: targeting?.targetServices ? JSON.parse(targeting.targetServices) : [],
      targetLocations: targeting?.targetLocations ? JSON.parse(targeting.targetLocations) : [],
      slides: story.slides.map((s: any) => ({
        id: s.id,
        order: s.order,
        duration: s.duration,
        bgType: s.bgType,
        bgImage: s.bgImage,
        bgVideo: s.bgVideo,
        bgColor: s.bgColor,
        bgGradient: s.bgGradient,
        heading: s.heading,
        headingSize: s.headingSize,
        headingColor: s.headingColor,
        subtext: s.subtext,
        subtextColor: s.subtextColor,
        textPosition: s.textPosition,
        textAnimation: s.textAnimation,
        ctaText: s.ctaText,
        ctaUrl: s.ctaUrl,
        ctaStyle: s.ctaStyle,
        canvasData: s.canvasData,
      })),
      reactions: {
        HEART: (story.reactions as any[]).filter((r) => r.reactionType === 'HEART').length,
        FIRE: (story.reactions as any[]).filter((r) => r.reactionType === 'FIRE').length,
        THUMBS_UP: (story.reactions as any[]).filter((r) => r.reactionType === 'THUMBS_UP').length,
        total: story.reactions.length,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch web story', error);
    return NextResponse.json({ error: 'Failed to fetch web story' }, { status: 500 });
  }
}

// PUT - Update story + full replace slides
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.web_stories.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

    // Check slug uniqueness if slug changed
    if (body.slug && body.slug !== existing.slug) {
      const slugConflict = await prisma.web_stories.findUnique({ where: { slug: body.slug } });
      if (slugConflict) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    // Update story fields
    const story = await prisma.web_stories.update({
      where: { id },
      data: {
        title: body.title?.trim() || existing.title,
        slug: body.slug?.trim() || existing.slug,
        description: body.description?.trim() ?? existing.description,
        metaDescription: body.metaDescription?.trim() ?? existing.metaDescription,
        coverImage: body.coverImage ?? existing.coverImage,
        coverImageSquare: body.coverImageSquare ?? existing.coverImageSquare,
        publisherName: body.publisherName?.trim() ?? existing.publisherName,
        publisherLogo: body.publisherLogo ?? existing.publisherLogo,
        category: body.category?.trim() ?? existing.category,
        expiresAt: body.expiresAt !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : existing.expiresAt,
        displayOrder: body.displayOrder ?? existing.displayOrder,
      },
    });

    // Save targeting fields via raw SQL
    if (body.targetServices !== undefined || body.targetLocations !== undefined) {
      const targetServices = Array.isArray(body.targetServices) && body.targetServices.length > 0
        ? JSON.stringify(body.targetServices) : null;
      const targetLocations = Array.isArray(body.targetLocations) && body.targetLocations.length > 0
        ? JSON.stringify(body.targetLocations) : null;
      await prisma.$executeRawUnsafe(
        'UPDATE web_stories SET targetServices = ?, targetLocations = ? WHERE id = ?',
        targetServices, targetLocations, id
      );
    }

    // Full replace slides if provided
    if (Array.isArray(body.slides)) {
      await prisma.web_story_slides.deleteMany({ where: { storyId: id } });

      if (body.slides.length > 0) {
        const slidesWithIds = body.slides.map((slide: any, index: number) => ({
          id: slide.id || generateId('wss'),
          canvasData: slide.canvasData || null,
          slide, index,
        }));

        await prisma.web_story_slides.createMany({
          data: slidesWithIds.map(({ id: slideId, slide, index }) => ({
            id: slideId,
            storyId: id,
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

        for (const { id: slideId, canvasData } of slidesWithIds) {
          if (canvasData) {
            await prisma.$executeRawUnsafe(
              'UPDATE web_story_slides SET canvasData = ? WHERE id = ?',
              canvasData, slideId
            );
          }
        }
      }
    }

    return NextResponse.json({ success: true, story: { id: story.id, slug: story.slug } });
  } catch (error) {
    logger.error('Failed to update web story', error);
    return NextResponse.json({ error: 'Failed to update web story' }, { status: 500 });
  }
}

// DELETE - Delete story (cascades to slides + reactions via Prisma schema)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.web_stories.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

    await prisma.web_stories.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete web story', error);
    return NextResponse.json({ error: 'Failed to delete web story' }, { status: 500 });
  }
}
