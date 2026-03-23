import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

// GET - Auto-expire stories whose expiresAt has passed
export async function GET(request: NextRequest) {
  try {
    const now = new Date();

    const result = await prisma.web_stories.updateMany({
      where: {
        isPublished: true,
        isArchived: false,
        expiresAt: { lte: now },
      },
      data: {
        isPublished: false,
        isArchived: true,
      },
    });

    console.log(`[Cron] Expired ${result.count} web stories`);

    return NextResponse.json({
      success: true,
      expired: result.count,
      ranAt: now.toISOString(),
    });
  } catch (error) {
    logger.error('Failed to expire web stories', error);
    return NextResponse.json({ error: 'Failed to expire stories' }, { status: 500 });
  }
}
