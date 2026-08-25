import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { createCrawlJob, summarizeCrawlJob, listCrawlJobs } from '@/lib/audit/crawl-job-store';
import { startCrawlInBackground } from '@/lib/audit/crawl-runner';

const DEFAULT_ROOT_SITEMAP = 'https://transrentals.in/sitemap.xml';
const MAX_URLS_CAP = 30_000;

/**
 * Start a site-wide crawl (sitemap discovery + HTTP status check per URL).
 * POST /api/admin/site-audit/crawl
 * Body: { rootSitemapUrl?: string, maxUrls?: number, concurrency?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const rootSitemapUrl = typeof body.rootSitemapUrl === 'string' && body.rootSitemapUrl
      ? body.rootSitemapUrl
      : DEFAULT_ROOT_SITEMAP;
    const maxUrls = Math.min(MAX_URLS_CAP, Math.max(0, parseInt(body.maxUrls, 10) || 0));
    const concurrency = Math.max(1, Math.min(20, parseInt(body.concurrency, 10) || 10));

    // Refuse to start a second crawl while one is already running — a
    // second worker pool hitting the same production site concurrently
    // would double the load for no benefit.
    const alreadyRunning = listCrawlJobs().find((j) => j.state === 'running' || j.state === 'discovering');
    if (alreadyRunning) {
      return NextResponse.json({
        error: 'A crawl is already in progress',
        jobId: alreadyRunning.id,
      }, { status: 409 });
    }

    const job = createCrawlJob(concurrency);
    startCrawlInBackground(job.id, rootSitemapUrl, maxUrls);

    return NextResponse.json({ jobId: job.id, job: summarizeCrawlJob(job) });
  } catch (error) {
    console.error('Site audit crawl start error:', error);
    return NextResponse.json({ error: 'Failed to start crawl' }, { status: 500 });
  }
}

/**
 * List recent crawl jobs.
 * GET /api/admin/site-audit/crawl
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobs = listCrawlJobs().map(summarizeCrawlJob);
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Site audit crawl list error:', error);
    return NextResponse.json({ error: 'Failed to list crawl jobs' }, { status: 500 });
  }
}
