/**
 * Runs a batch of URL Inspection API calls in the background, one at a
 * time with a fixed delay — Google enforces a strict per-property daily
 * quota (documented around 2,000/day) and a per-minute burst limit, so
 * unlike the crawler this deliberately does NOT use a worker pool.
 */

import { prisma } from '@/lib/db/prisma';
import { inspectUrl } from './url-inspection';
import { getInspectionJob, type InspectionJob } from './inspection-job-store';

export const DAILY_QUOTA = 2000;
const DELAY_BETWEEN_CALLS_MS = 400; // ~150/min, comfortably under Google's per-minute burst limit

function todayStartUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function getInspectionQuotaUsedToday(): Promise<number> {
  return prisma.site_audit_pages.count({
    where: { lastInspectedAt: { gte: todayStartUtc() } },
  });
}

/**
 * Picks which URLs to inspect: only pages our own crawl found returning
 * 2xx (there's no point asking Google about the indexing status of a page
 * we already know 404s), oldest-inspected (or never-inspected) first.
 */
async function pickUrlsToInspect(limit: number): Promise<string[]> {
  const rows = await prisma.site_audit_pages.findMany({
    where: { httpStatus: { gte: 200, lt: 300 } },
    orderBy: [{ lastInspectedAt: { sort: 'asc', nulls: 'first' } }],
    take: limit,
    select: { url: true },
  });
  return rows.map((r) => r.url);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function startInspectionInBackground(jobId: string, siteUrl: string, batchSize: number): void {
  const job = getInspectionJob(jobId);
  if (!job) return;

  (async () => {
    const usedToday = await getInspectionQuotaUsedToday();
    const remainingQuota = Math.max(0, DAILY_QUOTA - usedToday);
    const effectiveBatch = Math.min(batchSize, remainingQuota);

    if (effectiveBatch === 0) {
      job.state = 'error';
      job.lastError = `Daily quota exhausted (${usedToday}/${DAILY_QUOTA} used today) — try again tomorrow.`;
      job.finishedAt = Date.now();
      return;
    }

    const urls = await pickUrlsToInspect(effectiveBatch);
    job.total = urls.length;

    if (urls.length === 0) {
      job.state = 'done';
      job.finishedAt = Date.now();
      return;
    }

    for (const url of urls) {
      if (job.cancel) break;

      const result = await inspectUrl(siteUrl, url);
      job.checked += 1;
      if (result.error) job.failed += 1;
      else if (result.isIndexed) job.indexed += 1;
      else job.notIndexed += 1;

      await prisma.site_audit_pages.update({
        where: { url },
        data: {
          isIndexed: result.isIndexed,
          indexingVerdict: result.coverageState,
          indexingIssues: result.error ? JSON.stringify({ error: result.error }) : JSON.stringify(result.issues),
          lastInspectedAt: new Date(),
        },
      }).catch((err) => console.error(`Failed to save inspection result for ${url}:`, err));

      if (!job.cancel) await sleep(DELAY_BETWEEN_CALLS_MS);
    }

    job.state = job.cancel ? 'cancelled' : 'done';
    job.finishedAt = Date.now();
  })().catch((err: Error) => {
    job.state = 'error';
    job.lastError = err.message;
    job.finishedAt = Date.now();
  });
}
