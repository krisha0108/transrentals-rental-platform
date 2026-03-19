import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Public list of published, non-archived, non-expired stories
export async function GET(request: NextRequest) {
  try {
    const now = new Date();

    const stories = await prisma.web_stories.findMany({
      where: {
        isPublished: true,
        isArchived: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      orderBy: [{ displayOrder: 'asc' }, { publishedAt: 'desc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        coverImageSquare: true,
        publisherName: true,
        publisherLogo: true,
        category: true,
        publishedAt: true,
        slides: { select: { id: true } },
        reactions: { select: { reactionType: true } },
      },
    });

    const formatted = stories.map((s: any) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      coverImage: s.coverImage,
      coverImageSquare: s.coverImageSquare,
      publisherName: s.publisherName,
      publisherLogo: s.publisherLogo,
      category: s.category,
      publishedAt: s.publishedAt?.toISOString() || null,
      slideCount: s.slides.length,
      totalReactions: s.reactions.length,
    }));

    return NextResponse.json({ stories: formatted });
  } catch (error) {
    logger.error('Failed to fetch public web stories', error);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }
}
