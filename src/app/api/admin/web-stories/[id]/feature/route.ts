import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// PATCH - Toggle whether a story shows in the homepage carousel
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

    const story = await prisma.web_stories.update({
      where: { id },
      data: { isFeatured: !existing.isFeatured },
    });

    return NextResponse.json({ success: true, isFeatured: story.isFeatured });
  } catch (error) {
    logger.error('Failed to toggle web story featured status', error);
    return NextResponse.json({ error: 'Failed to toggle featured status' }, { status: 500 });
  }
}
