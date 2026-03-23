import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Single published story by slug with slides + reaction counts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const now = new Date();

    const story = await prisma.web_stories.findUnique({
      where: { slug },
      include: {
        slides: { orderBy: { order: 'asc' } },
        reactions: { select: { reactionType: true } },
      },
    });

    if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    if (!story.isPublished) return NextResponse.json({ error: 'Story not published' }, { status: 404 });
    if (story.isArchived) return NextResponse.json({ error: 'Story archived' }, { status: 404 });
    if (story.expiresAt && story.expiresAt <= now) return NextResponse.json({ error: 'Story expired' }, { status: 404 });

    const reactionCounts = {
      HEART: (story.reactions as any[]).filter((r) => r.reactionType === 'HEART').length,
      FIRE: (story.reactions as any[]).filter((r) => r.reactionType === 'FIRE').length,
      THUMBS_UP: (story.reactions as any[]).filter((r) => r.reactionType === 'THUMBS_UP').length,
    };

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
      publishedAt: story.publishedAt?.toISOString() || null,
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
      })),
      reactions: reactionCounts,
    });
  } catch (error) {
    logger.error('Failed to fetch web story by slug', error);
    return NextResponse.json({ error: 'Failed to fetch story' }, { status: 500 });
  }
}
