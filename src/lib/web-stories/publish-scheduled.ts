import { prisma } from '@/lib/db/prisma';

// Flips any story whose scheduled publish time has arrived to actually
// published — the same "computed at read time" approach this model already
// uses for `expiresAt` (no cron job; this runs opportunistically whenever
// the public or admin story list is requested, which is frequent enough on
// a live site to make "schedule for later" behave correctly in practice).
export async function publishScheduledStories(): Promise<void> {
  await prisma.web_stories.updateMany({
    where: {
      isPublished: false,
      isArchived: false,
      scheduledAt: { lte: new Date() },
    },
    data: {
      isPublished: true,
      publishedAt: new Date(),
    },
  });
}
