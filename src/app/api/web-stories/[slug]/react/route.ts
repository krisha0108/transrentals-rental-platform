import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

function generateId(): string {
  return 'wsr' + crypto.randomBytes(12).toString('base64url').toLowerCase().slice(0, 24);
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');

  if (cfIp) return cfIp.trim();
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIp) return realIp.trim();
  return '0.0.0.0';
}

// POST - React to a story
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const { reactionType } = body;
    if (!['HEART', 'FIRE', 'THUMBS_UP'].includes(reactionType)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    const story = await prisma.web_stories.findUnique({
      where: { slug },
      select: { id: true, isPublished: true, isArchived: true },
    });

    if (!story || !story.isPublished || story.isArchived) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const userIp = getClientIp(request);
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Check for duplicate reaction from same IP in last 24h
    // Skip dedup if IP is unknown (0.0.0.0) — prevents blocking all users on proxied servers
    if (userIp && userIp !== '0.0.0.0') {
      const existing = await prisma.web_story_reactions.findFirst({
        where: {
          storyId: story.id,
          reactionType: reactionType as any,
          userIp,
          createdAt: { gte: since24h },
        },
      });

      if (existing) {
        // Return current counts so client can sync
        const reactions = await prisma.web_story_reactions.groupBy({
          by: ['reactionType'],
          where: { storyId: story.id },
          _count: { reactionType: true },
        });
        const counts = { HEART: 0, FIRE: 0, THUMBS_UP: 0 };
        for (const r of reactions) {
          counts[r.reactionType as keyof typeof counts] = r._count.reactionType;
        }
        return NextResponse.json({ error: 'Already reacted', reactions: counts }, { status: 429 });
      }
    }

    // Save reaction
    await prisma.web_story_reactions.create({
      data: {
        id: generateId(),
        storyId: story.id,
        reactionType: reactionType as any,
        userIp,
      },
    });

    // Get updated counts
    const reactions = await prisma.web_story_reactions.groupBy({
      by: ['reactionType'],
      where: { storyId: story.id },
      _count: { reactionType: true },
    });

    const counts = { HEART: 0, FIRE: 0, THUMBS_UP: 0 };
    for (const r of reactions) {
      counts[r.reactionType as keyof typeof counts] = r._count.reactionType;
    }

    return NextResponse.json({ success: true, reactions: counts });
  } catch (error) {
    logger.error('Failed to save reaction', error);
    return NextResponse.json({ error: 'Failed to save reaction' }, { status: 500 });
  }
}
