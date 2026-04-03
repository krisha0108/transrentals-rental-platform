import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const story = await prisma.web_stories.findUnique({
      where: { slug },
      select: { id: true, isPublished: true, isArchived: true },
    });

    if (!story || !story.isPublished || story.isArchived) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    const userIp = getClientIp(request);

    // Dedup: same IP can only add 1 view per story per day
    if (userIp) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);

      const existing = await prisma.web_story_views.findFirst({
        where: { storyId: story.id, userIp, viewedAt: { gte: dayStart } },
        select: { id: true },
      });

      if (existing) {
        const total = await prisma.web_story_views.count({ where: { storyId: story.id } });
        return NextResponse.json({ ok: true, views: total });
      }
    }

    await prisma.web_story_views.create({
      data: {
        id: 'wsv' + crypto.randomBytes(10).toString('base64url').toLowerCase().slice(0, 20),
        storyId: story.id,
        userIp,
      },
    });

    const total = await prisma.web_story_views.count({ where: { storyId: story.id } });
    return NextResponse.json({ ok: true, views: total });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
