/**
 * Runs a batch of PageSpeed Insights checks in the background with a small
 * worker pool. Each individual request is slow (a real Lighthouse run, often
 * 15-40s), so the pool stays small (default 3) even though the API's daily
 * quota (25,000/day with a key) is generous — throughput is bounded by
 * request latency here, not quota.
 */

import { prisma } from '@/lib/db/prisma';
import { checkVitals } from './pagespeed';
import { getVitalsJob, type VitalsJob } from './vitals-job-store';

async function pickUrlsForVitals(limit: number): Promise<string[]> {
  const rows = await prisma.site_audit_pages.findMany({
    where: { httpStatus: { gte: 200, lt: 300 } },
    orderBy: [{ lastVitalsCheckAt: { sort: 'asc', nulls: 'first' } }],
    take: limit,
    select: { url: true },
  });
  return rows.map((r) => r.url);
}

async function checkAndSave(url: string, strategy: 'mobile' | 'desktop', job: VitalsJob) {
  const result = await checkVitals(url, strategy);
  job.checked += 1;
  if (result.error) job.failed += 1;

  await prisma.site_audit_pages.update({
    where: { url },
    data: {
      lcpMs: result.lcpMs,
      cls: result.cls,
      inpMs: result.inpMs,
      performanceScore: result.performanceScore,
      lastVitalsCheckAt: new Date(),
    },
  }).catch((err) => console.error(`Failed to save vitals for ${url}:`, err));
}

export function startVitalsInBackground(jobId: string, batchSize: number): void {
  const job = getVitalsJob(jobId);
  if (!job) return;

  (async () => {
    const urls = await pickUrlsForVitals(batchSize);
    job.total = urls.length;

    if (urls.length === 0) {
      job.state = 'done';
      job.finishedAt = Date.now();
      return;
    }

    const queue = [...urls];
    const workers = Array.from({ length: job.concurrency }, async () => {
      while (queue.length > 0) {
        if (job.cancel) break;
        const next = queue.shift();
        if (!next) break;
        await checkAndSave(next, job.strategy, job);
      }
    });

    await Promise.all(workers);
    job.state = job.cancel ? 'cancelled' : 'done';
    job.finishedAt = Date.now();
  })().catch((err: Error) => {
    job.state = 'error';
    job.lastError = err.message;
    job.finishedAt = Date.now();
  });
}
