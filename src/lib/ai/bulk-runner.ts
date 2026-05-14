/**
 * Bulk generation runner — processes a BulkJob in the background with
 * bounded concurrency. Updates DB row for each successful item.
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import {
  generatePageContent,
  contentToDbFields,
  GenerateError,
} from './seo-content-generator';
import { getJob, type BulkJob, type BulkItem } from './bulk-job-store';

async function runOneItem(job: BulkJob, item: BulkItem, editor: string): Promise<void> {
  item.status = 'running';
  const startedAt = Date.now();

  try {
    const result = await generatePageContent({
      serviceSlug: item.serviceSlug,
      citySlug: item.citySlug,
      customInstructions: job.customInstructions,
    });

    const dbFields = contentToDbFields(result.content);
    const row = await prisma.service_city_content.upsert({
      where: {
        serviceSlug_citySlug: {
          serviceSlug: item.serviceSlug,
          citySlug: item.citySlug,
        },
      },
      create: {
        serviceSlug: item.serviceSlug,
        citySlug: item.citySlug,
        ...dbFields,
        status: 'ai_generated',
        source: 'ai',
        aiPrompt: job.customInstructions ?? null,
        aiModel: result.model,
        aiTokensUsed: result.usage.totalTokens,
        lastAiUpdate: new Date(),
        lastEditedBy: editor,
      },
      update: {
        ...dbFields,
        status: 'ai_generated',
        source: 'ai',
        aiPrompt: job.customInstructions ?? null,
        aiModel: result.model,
        aiTokensUsed: result.usage.totalTokens,
        lastAiUpdate: new Date(),
        lastEditedBy: editor,
      },
      select: { id: true },
    });

    item.status = 'done';
    item.tokensUsed = result.usage.totalTokens;
    item.elapsedMs = Date.now() - startedAt;
    item.savedId = row.id;
    job.completed += 1;
    job.totalTokensUsed += result.usage.totalTokens;

    try {
      revalidatePath(`/${item.serviceSlug}/${item.citySlug}`);
    } catch (err) {
      // revalidatePath only works inside a request context; in some bulk
      // backgrounds it can no-op. Page ISR (revalidate: 3600) is the safety net.
    }
  } catch (err) {
    item.status = 'error';
    item.error = err instanceof GenerateError ? err.message : (err as Error).message;
    item.elapsedMs = Date.now() - startedAt;
    job.failed += 1;
  }
}

export function startJobInBackground(jobId: string, editor: string): void {
  const job = getJob(jobId);
  if (!job) return;
  job.state = 'running';

  // Fire-and-forget; errors inside should not crash anything.
  (async () => {
    const queue = [...job.items];
    const workers = Array.from({ length: job.concurrency }, async () => {
      while (queue.length > 0) {
        if (job.cancel) break;
        const next = queue.shift();
        if (!next) break;
        await runOneItem(job, next, editor);
      }
    });
    await Promise.all(workers);
    job.state = job.cancel ? 'cancelled' : 'done';
    job.finishedAt = Date.now();
  })().catch(() => {
    job.state = 'done';
    job.finishedAt = Date.now();
  });
}
