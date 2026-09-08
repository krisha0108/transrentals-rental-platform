import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { logSystemEvent } from '@/lib/system-health/log-event';

export const dynamic = 'force-dynamic';

// GET - Auto-expire stories whose expiresAt has passed
export async function GET(request: NextRequest) {
  const startedAt = Date.now();
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

    await logSystemEvent({ category: 'CRON', sourceName: 'expire-web-stories', status: 'SUCCESS', message: `${result.count} story(ies) expired`, durationMs: Date.now() - startedAt });

    return NextResponse.json({
      success: true,
      expired: result.count,
      ranAt: now.toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to expire web stories', error);
    await logSystemEvent({ category: 'CRON', sourceName: 'expire-web-stories', status: 'FAILURE', message: error?.message || 'Unknown error', durationMs: Date.now() - startedAt });
    return NextResponse.json({ error: 'Failed to expire stories' }, { status: 500 });
  }
}
