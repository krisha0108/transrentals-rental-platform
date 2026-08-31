/**
 * In-memory job store for URL Inspection batches — same shape as
 * crawl-job-store.ts, kept separate since the two run under very
 * different rate constraints (the crawler is our own server hitting our
 * own site; this one is bound by Google's per-property daily quota).
 */

import { randomUUID } from 'crypto';

export type InspectionJobState = 'running' | 'done' | 'cancelled' | 'error';

export type InspectionJob = {
  id: string;
  state: InspectionJobState;
  siteUrl: string;
  total: number;
  checked: number;
  indexed: number;
  notIndexed: number;
  failed: number;
  concurrency: number;
  startedAt: number;
  finishedAt?: number;
  cancel: boolean;
  lastError?: string;
};

const STORE = new Map<string, InspectionJob>();
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

export function createInspectionJob(siteUrl: string): InspectionJob {
  const id = randomUUID();
  const job: InspectionJob = {
    id,
    state: 'running',
    siteUrl,
    total: 0,
    checked: 0,
    indexed: 0,
    notIndexed: 0,
    failed: 0,
    concurrency: 1,
    startedAt: Date.now(),
    cancel: false,
  };
  STORE.set(id, job);
  evictOld();
  return job;
}

export function getInspectionJob(id: string): InspectionJob | undefined {
  return STORE.get(id);
}

export function cancelInspectionJob(id: string): boolean {
  const job = STORE.get(id);
  if (!job) return false;
  if (job.state !== 'running') return false;
  job.cancel = true;
  return true;
}

export function listInspectionJobs(): InspectionJob[] {
  return [...STORE.values()].sort((a, b) => b.startedAt - a.startedAt);
}

export function summarizeInspectionJob(job: InspectionJob) {
  const elapsedMs = (job.finishedAt ?? Date.now()) - job.startedAt;
  const avgMs = job.checked > 0 ? elapsedMs / job.checked : 0;
  const remaining = job.total - job.checked;
  const etaMs = avgMs > 0 && job.state === 'running' ? Math.round(remaining * avgMs) : null;

  return {
    id: job.id,
    state: job.state,
    siteUrl: job.siteUrl,
    total: job.total,
    checked: job.checked,
    indexed: job.indexed,
    notIndexed: job.notIndexed,
    failed: job.failed,
    startedAt: new Date(job.startedAt).toISOString(),
    finishedAt: job.finishedAt ? new Date(job.finishedAt).toISOString() : null,
    elapsedMs,
    etaMs,
    lastError: job.lastError ?? null,
  };
}
