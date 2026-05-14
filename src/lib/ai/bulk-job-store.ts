/**
 * In-memory bulk generation job store.
 *
 * Single-process: jobs live in this map. On server restart, in-flight
 * jobs are lost (results that already wrote to DB are preserved).
 * Adequate for the admin-only use case — bulk runs are kicked off by
 * a human and watched in the UI.
 */

import { randomUUID } from 'crypto';

export type BulkTarget = {
  serviceSlug: string;
  citySlug: string;
};

export type BulkItemStatus = 'pending' | 'running' | 'done' | 'error';

export type BulkItem = BulkTarget & {
  status: BulkItemStatus;
  error?: string;
  tokensUsed?: number;
  elapsedMs?: number;
  savedId?: string;
};

export type BulkJobState = 'queued' | 'running' | 'done' | 'cancelled';

export type BulkJob = {
  id: string;
  state: BulkJobState;
  items: BulkItem[];
  customInstructions?: string;
  concurrency: number;
  total: number;
  completed: number;
  failed: number;
  totalTokensUsed: number;
  startedAt: number;
  finishedAt?: number;
  cancel: boolean;
};

const STORE = new Map<string, BulkJob>();
const MAX_RETAINED_JOBS = 50;

function evictOld() {
  if (STORE.size <= MAX_RETAINED_JOBS) return;
  const done = [...STORE.values()]
    .filter((j) => j.state === 'done' || j.state === 'cancelled')
    .sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0));
  for (const j of done) {
    if (STORE.size <= MAX_RETAINED_JOBS) break;
    STORE.delete(j.id);
  }
}

export function createJob(opts: {
  targets: BulkTarget[];
  customInstructions?: string;
  concurrency?: number;
}): BulkJob {
  const id = randomUUID();
  const job: BulkJob = {
    id,
    state: 'queued',
    items: opts.targets.map((t) => ({ ...t, status: 'pending' })),
    customInstructions: opts.customInstructions,
    concurrency: Math.max(1, Math.min(10, opts.concurrency ?? 5)),
    total: opts.targets.length,
    completed: 0,
    failed: 0,
    totalTokensUsed: 0,
    startedAt: Date.now(),
    cancel: false,
  };
  STORE.set(id, job);
  evictOld();
  return job;
}

export function getJob(id: string): BulkJob | undefined {
  return STORE.get(id);
}

export function cancelJob(id: string): boolean {
  const job = STORE.get(id);
  if (!job) return false;
  if (job.state === 'done' || job.state === 'cancelled') return false;
  job.cancel = true;
  return true;
}

export function listJobs(): BulkJob[] {
  return [...STORE.values()].sort((a, b) => b.startedAt - a.startedAt);
}

export function summarizeJob(job: BulkJob) {
  const elapsedMs = (job.finishedAt ?? Date.now()) - job.startedAt;
  const avgMs = job.completed > 0 ? Math.round(elapsedMs / job.completed) : 0;
  const remaining = job.total - job.completed - job.failed;
  const etaMs = avgMs > 0 ? remaining * (avgMs / job.concurrency) : null;

  return {
    id: job.id,
    state: job.state,
    total: job.total,
    completed: job.completed,
    failed: job.failed,
    pending: remaining,
    totalTokensUsed: job.totalTokensUsed,
    concurrency: job.concurrency,
    customInstructions: job.customInstructions ?? null,
    startedAt: new Date(job.startedAt).toISOString(),
    finishedAt: job.finishedAt ? new Date(job.finishedAt).toISOString() : null,
    elapsedMs,
    avgPerItemMs: avgMs,
    etaMs,
    items: job.items.map((i) => ({
      serviceSlug: i.serviceSlug,
      citySlug: i.citySlug,
      status: i.status,
      error: i.error ?? null,
      tokensUsed: i.tokensUsed ?? null,
      elapsedMs: i.elapsedMs ?? null,
      savedId: i.savedId ?? null,
    })),
  };
}
