/**
 * Daily SEO content refresh cron.
 *
 * Picks N service_city_content rows where autoUpdate=true and either:
 *   - lastAiUpdate is null (never AI-generated), OR
 *   - lastAiUpdate is older than `staleDays` days ago
 *
 * Skips rows where source='manual' AND lastEditedBy starts with 'admin:'
 * within the last `manualGraceDays` days — respect human edits.
 *
 * Protected by x-cron-secret header.
 *
 * Server cron setup (run daily at 3 AM IST):
 *   0 3 * * * curl -sS -X POST -H "x-cron-secret: YOUR_SECRET" https://your-domain.com/api/cron/seo-content-refresh
 *
 * Test from CLI:
 *   curl -X POST -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/seo-content-refresh
 *
 * Query params:
 *   ?limit=N          override max items (default 50, hard cap 200)
 *   ?staleDays=N      override stale threshold (default 7)
 *   ?dryRun=1         return candidates without generating
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createJob, summarizeJob, type BulkTarget } from '@/lib/ai/bulk-job-store';
import { startJobInBackground } from '@/lib/ai/bulk-runner';
import { logSystemEvent } from '@/lib/system-health/log-event';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 50;
const HARD_LIMIT = 200;
const DEFAULT_STALE_DAYS = 7;
const MANUAL_GRACE_DAYS = 30;

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const cronSecret = request.headers.get('x-cron-secret');
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(HARD_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));
    const staleDays = Math.max(1, parseInt(searchParams.get('staleDays') || String(DEFAULT_STALE_DAYS), 10));
    const dryRun = searchParams.get('dryRun') === '1';

    const now = new Date();
    const staleThreshold = new Date(now.getTime() - staleDays * 24 * 60 * 60 * 1000);
    const manualGraceThreshold = new Date(now.getTime() - MANUAL_GRACE_DAYS * 24 * 60 * 60 * 1000);

    // Find candidates: autoUpdate ON, either never run by AI OR last AI ran before staleThreshold
    const candidates = await prisma.service_city_content.findMany({
      where: {
        autoUpdate: true,
        OR: [
          { lastAiUpdate: null },
          { lastAiUpdate: { lt: staleThreshold } },
        ],
      },
      orderBy: [
        { lastAiUpdate: { sort: 'asc', nulls: 'first' } },
        { updatedAt: 'asc' },
      ],
      take: limit * 2, // overfetch — filter manual-recent in JS
      select: {
        id: true,
        serviceSlug: true,
        citySlug: true,
        source: true,
        updatedAt: true,
        lastEditedBy: true,
        lastAiUpdate: true,
      },
    });

    // Filter out manually-edited-recently rows
    const eligible = candidates.filter((c) => {
      const recentManual =
        c.source === 'manual' &&
        c.lastEditedBy?.startsWith('admin:') &&
        c.updatedAt > manualGraceThreshold;
      return !recentManual;
    }).slice(0, limit);

    const targets: BulkTarget[] = eligible.map((c) => ({
      serviceSlug: c.serviceSlug,
      citySlug: c.citySlug,
    }));

    if (dryRun) {
      await logSystemEvent({ category: 'CRON', sourceName: 'seo-content-refresh', status: 'SUCCESS', message: `Dry run: ${eligible.length} eligible of ${candidates.length} candidates`, durationMs: Date.now() - startedAt });
      return NextResponse.json({
        dryRun: true,
        candidates: candidates.length,
        eligible: eligible.length,
        wouldRun: targets,
        now: now.toISOString(),
        staleThreshold: staleThreshold.toISOString(),
        manualGraceThreshold: manualGraceThreshold.toISOString(),
      });
    }

    if (targets.length === 0) {
      await logSystemEvent({ category: 'CRON', sourceName: 'seo-content-refresh', status: 'SUCCESS', message: 'No rows due for refresh', durationMs: Date.now() - startedAt });
      return NextResponse.json({
        message: 'No rows due for refresh',
        candidates: candidates.length,
        eligible: 0,
        now: now.toISOString(),
      });
    }

    const job = createJob({ targets, concurrency: 3 });
    startJobInBackground(job.id, 'cron:seo-content-refresh');

    await logSystemEvent({ category: 'CRON', sourceName: 'seo-content-refresh', status: 'SUCCESS', message: `Job ${job.id} enqueued: ${targets.length} target(s)`, durationMs: Date.now() - startedAt });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      accepted: targets.length,
      skipped_recent_manual: candidates.length - eligible.length,
      summary: summarizeJob(job),
      note: 'Job runs in background. Poll /api/admin/seo-content/bulk-status/[jobId] for progress.',
    });
  } catch (error: any) {
    await logSystemEvent({ category: 'CRON', sourceName: 'seo-content-refresh', status: 'FAILURE', message: error?.message || 'Unknown error', durationMs: Date.now() - startedAt });
    return NextResponse.json({ error: 'SEO content refresh failed', details: error?.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret');
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const eligibleCount = await prisma.service_city_content.count({
    where: { autoUpdate: true },
  });

  const dueCount = await prisma.service_city_content.count({
    where: {
      autoUpdate: true,
      OR: [
        { lastAiUpdate: null },
        { lastAiUpdate: { lt: new Date(Date.now() - DEFAULT_STALE_DAYS * 24 * 60 * 60 * 1000) } },
      ],
    },
  });

  return NextResponse.json({
    autoUpdateEnabled: eligibleCount,
    dueForRefresh: dueCount,
    defaults: { limit: DEFAULT_LIMIT, staleDays: DEFAULT_STALE_DAYS, manualGraceDays: MANUAL_GRACE_DAYS },
    usage: 'POST with x-cron-secret header to trigger. Optional query: ?limit=&staleDays=&dryRun=1',
  });
}
