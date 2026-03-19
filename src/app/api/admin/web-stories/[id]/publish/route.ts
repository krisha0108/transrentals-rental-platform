import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// PATCH - Toggle publish/unpublish
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.web_stories.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

    const willPublish = !existing.isPublished;

    const story = await prisma.web_stories.update({
      where: { id },
      data: {
        isPublished: willPublish,
        isArchived: willPublish ? false : existing.isArchived,
        publishedAt: willPublish ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      isPublished: story.isPublished,
      publishedAt: story.publishedAt?.toISOString() || null,
    });
  } catch (error) {
    logger.error('Failed to toggle web story publish', error);
    return NextResponse.json({ error: 'Failed to toggle publish status' }, { status: 500 });
  }
}
