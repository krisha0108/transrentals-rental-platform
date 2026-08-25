/**
 * In-memory crawl job store — same pattern as src/lib/ai/bulk-job-store.ts.
 * Single-process: progress lives here for the UI to poll; individual page
 * results are written to site_audit_pages as they complete, so a server
 * restart mid-crawl loses only the progress bar, not the results already
 * checked.
 */

import { randomUUID } from 'crypto';

export type CrawlJobState = 'discovering' | 'running' | 'done' | 'cancelled' | 'error';

export type CrawlJob = {
  id: string;
  state: CrawlJobState;
  total: number;
  checked: number;
  errors: number;
  statusCounts: Record<string, number>; // e.g. { '200': 1000, '404': 12, '301': 40 }
  concurrency: number;
  startedAt: number;
  finishedAt?: number;
  cancel: boolean;
  lastError?: string;
};

const STORE = new Map<string, CrawlJob>();
const MAX_RETAINED_JOBS = 20;

function evictOld() {
  if (STORE.size <= MAX_RETAINED_JOBS) return;
  const done = [...STORE.values()]
    .filter((j) => j.state === 'done' || j.state === 'cancelled' || j.state === 'error')
    .sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0));
  for (const j of done) {
    if (STORE.size <= MAX_RETAINED_JOBS) break;
    STORE.delete(j.id);
  }
}

export function createCrawlJob(concurrency: number): CrawlJob {
  const id = randomUUID();
  const job: CrawlJob = {
    id,
    state: 'discovering',
    total: 0,
    checked: 0,
    errors: 0,
    statusCounts: {},
    concurrency: Math.max(1, Math.min(20, concurrency)),
    startedAt: Date.now(),
    cancel: false,
  };
  STORE.set(id, job);
  evictOld();
  return job;
}

export function getCrawlJob(id: string): CrawlJob | undefined {
  return STORE.get(id);
}

export function cancelCrawlJob(id: string): boolean {
  const job = STORE.get(id);
  if (!job) return false;
  if (job.state === 'done' || job.state === 'cancelled' || job.state === 'error') return false;
  job.cancel = true;
  return true;
}

export function listCrawlJobs(): CrawlJob[] {
  return [...STORE.values()].sort((a, b) => b.startedAt - a.startedAt);
}

export function summarizeCrawlJob(job: CrawlJob) {
  const elapsedMs = (job.finishedAt ?? Date.now()) - job.startedAt;
  const avgMs = job.checked > 0 ? elapsedMs / job.checked : 0;
  const remaining = job.total - job.checked;
  const etaMs = avgMs > 0 && job.state === 'running' ? Math.round(remaining * (avgMs / job.concurrency)) : null;

  return {
    id: job.id,
    state: job.state,
    total: job.total,
    checked: job.checked,
    errors: job.errors,
    statusCounts: job.statusCounts,
    concurrency: job.concurrency,
    startedAt: new Date(job.startedAt).toISOString(),
    finishedAt: job.finishedAt ? new Date(job.finishedAt).toISOString() : null,
    elapsedMs,
    etaMs,
    lastError: job.lastError ?? null,
  };
}
