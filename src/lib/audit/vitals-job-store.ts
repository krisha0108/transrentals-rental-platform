/**
 * In-memory job store for Web Vitals batches — same shape as the other two
 * (crawl-job-store.ts, inspection-job-store.ts). Kept separate because
 * PageSpeed Insights has its own (much more generous) rate profile: a
 * worker pool is fine here, unlike the sequential-only URL Inspection job.
 */

import { randomUUID } from 'crypto';

export type VitalsJobState = 'running' | 'done' | 'cancelled' | 'error';

export type VitalsJob = {
  id: string;
  state: VitalsJobState;
  strategy: 'mobile' | 'desktop';
  total: number;
  checked: number;
  failed: number;
  concurrency: number;
  startedAt: number;
  finishedAt?: number;
  cancel: boolean;
  lastError?: string;
};

const STORE = new Map<string, VitalsJob>();
const MAX_RETAINED_JOBS = 20;

function evictOld() {
  if (STORE.size <= MAX_RETAINED_JOBS) return;
  const done = [...STORE.values()]
    .filter((j) => j.state !== 'running')
    .sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0));
  for (const j of done) {
    if (STORE.size <= MAX_RETAINED_JOBS) break;
    STORE.delete(j.id);
  }
}

export function createVitalsJob(strategy: 'mobile' | 'desktop', concurrency: number): VitalsJob {
  const id = randomUUID();
  const job: VitalsJob = {
    id,
    state: 'running',
    strategy,
    total: 0,
    checked: 0,
    failed: 0,
    concurrency: Math.max(1, Math.min(8, concurrency)),
    startedAt: Date.now(),
    cancel: false,
  };
  STORE.set(id, job);
  evictOld();
  return job;
}

export function getVitalsJob(id: string): VitalsJob | undefined {
  return STORE.get(id);
}

export function cancelVitalsJob(id: string): boolean {
  const job = STORE.get(id);
  if (!job) return false;
  if (job.state !== 'running') return false;
  job.cancel = true;
  return true;
}

export function listVitalsJobs(): VitalsJob[] {
  return [...STORE.values()].sort((a, b) => b.startedAt - a.startedAt);
}

export function summarizeVitalsJob(job: VitalsJob) {
  const elapsedMs = (job.finishedAt ?? Date.now()) - job.startedAt;
  const avgMs = job.checked > 0 ? elapsedMs / job.checked : 0;
  const remaining = job.total - job.checked;
  const etaMs = avgMs > 0 && job.state === 'running' ? Math.round(remaining * (avgMs / job.concurrency)) : null;

  return {
    id: job.id,
    state: job.state,
    strategy: job.strategy,
    total: job.total,
    checked: job.checked,
    failed: job.failed,
    concurrency: job.concurrency,
    startedAt: new Date(job.startedAt).toISOString(),
    finishedAt: job.finishedAt ? new Date(job.finishedAt).toISOString() : null,
    elapsedMs,
    etaMs,
    lastError: job.lastError ?? null,
  };
}
