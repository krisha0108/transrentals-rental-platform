// Persists a run-history row for a cron job or notification-send attempt so
// the admin Operations Tracker's System Health tab can show real
// success/failure data. Deliberately fire-and-forget with its own catch —
// a logging failure must never break the cron job or notification send it's
// describing.

import { prisma } from '@/lib/db/prisma';

type SystemEventCategory = 'CRON' | 'NOTIFICATION';
type SystemEventStatus = 'SUCCESS' | 'FAILURE';

export async function logSystemEvent(params: {
  category: SystemEventCategory;
  sourceName: string;
  status: SystemEventStatus;
  message?: string | null;
  durationMs?: number;
}) {
  try {
    await prisma.system_event_logs.create({
      data: {
        category: params.category,
        sourceName: params.sourceName,
        status: params.status,
        message: params.message ? params.message.slice(0, 2000) : null,
        durationMs: params.durationMs,
      },
    });
  } catch (err) {
    console.error('[system-health] Failed to persist event log', err);
  }
}
