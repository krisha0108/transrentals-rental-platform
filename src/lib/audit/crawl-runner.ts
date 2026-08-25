/**
 * Runs a site-wide crawl in the background: discovers every URL from the
 * live sitemap(s), then checks each with a rate-limited worker pool and
 * upserts the result into site_audit_pages. Same fire-and-forget +
 * bounded-concurrency shape as src/lib/ai/bulk-runner.ts.
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { discoverSitemapUrls, type SitemapUrl } from './sitemap';
import { getCrawlJob, type CrawlJob } from './crawl-job-store';

const REQUEST_TIMEOUT_MS = 10_000;
const USER_AGENT = 'TransRentalsSiteAudit/1.0 (+https://transrentals.in)';

type CheckResult = {
  httpStatus: number | null;
  redirectTo: string | null;
  crawlError: string | null;
};

async function checkOne(url: string): Promise<CheckResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'HEAD',
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT },
      });
      // Some servers/routes don't implement HEAD correctly (405, or a 200
      // that doesn't reflect the real page) — fall back to GET for those.
      if (res.status === 405 || res.status === 501) {
        res = await fetch(url, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: { 'User-Agent': USER_AGENT },
        });
      }
    } catch (err) {
      return { httpStatus: null, redirectTo: null, crawlError: (err as Error).message.slice(0, 191) };
    }

    const isRedirect = res.status >= 300 && res.status < 400;
    const redirectTo = isRedirect ? res.headers.get('location') : null;

    return { httpStatus: res.status, redirectTo: redirectTo ? redirectTo.slice(0, 1000) : null, crawlError: null };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkAndSave(item: SitemapUrl, job: CrawlJob) {
  const result = await checkOne(item.url);

  const key = result.httpStatus != null ? String(result.httpStatus) : 'error';
  job.statusCounts[key] = (job.statusCounts[key] ?? 0) + 1;
  if (result.crawlError) job.errors += 1;
  job.checked += 1;

  await prisma.site_audit_pages.upsert({
    where: { url: item.url },
    create: {
      id: randomUUID(),
      url: item.url,
      sourceSitemap: item.sourceSitemap,
      httpStatus: result.httpStatus,
      redirectTo: result.redirectTo,
      crawlError: result.crawlError,
      lastCrawledAt: new Date(),
    },
    update: {
      sourceSitemap: item.sourceSitemap,
      httpStatus: result.httpStatus,
      redirectTo: result.redirectTo,
      crawlError: result.crawlError,
      lastCrawledAt: new Date(),
    },
  }).catch((err) => {
    console.error(`Failed to save crawl result for ${item.url}:`, err);
  });
}

export function startCrawlInBackground(jobId: string, rootSitemapUrl: string, maxUrls: number): void {
  const job = getCrawlJob(jobId);
  if (!job) return;

  (async () => {
    let urls: SitemapUrl[];
    try {
      urls = await discoverSitemapUrls(rootSitemapUrl);
    } catch (err) {
      job.state = 'error';
      job.lastError = (err as Error).message;
      job.finishedAt = Date.now();
      return;
    }

    if (job.cancel) {
      job.state = 'cancelled';
      job.finishedAt = Date.now();
      return;
    }

    // De-dupe (a URL can legitimately appear in more than one sitemap).
    const seen = new Set<string>();
    const deduped = urls.filter((u) => {
      if (seen.has(u.url)) return false;
      seen.add(u.url);
      return true;
    });

    const capped = maxUrls > 0 ? deduped.slice(0, maxUrls) : deduped;
    job.total = capped.length;
    job.state = 'running';

    const queue = [...capped];
    const workers = Array.from({ length: job.concurrency }, async () => {
      while (queue.length > 0) {
        if (job.cancel) break;
        const next = queue.shift();
        if (!next) break;
        await checkAndSave(next, job);
      }
    });

    await Promise.all(workers);
    job.state = job.cancel ? 'cancelled' : 'done';
    job.finishedAt = Date.now();
  })().catch((err) => {
    job.state = 'error';
    job.lastError = (err as Error).message;
    job.finishedAt = Date.now();
  });
}
