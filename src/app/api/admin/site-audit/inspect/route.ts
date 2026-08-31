import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { createInspectionJob, summarizeInspectionJob, listInspectionJobs } from '@/lib/audit/inspection-job-store';
import { startInspectionInBackground, getInspectionQuotaUsedToday, DAILY_QUOTA } from '@/lib/audit/inspection-runner';

const MAX_BATCH_SIZE = 500;

/**
 * Start a URL Inspection batch against pages our own crawl found live
 * (2xx). Only one property's worth of quota exists at a time, so the
 * caller must pass the exact siteUrl as registered in Search Console.
 * POST /api/admin/site-audit/inspect
 * Body: { siteUrl: string, batchSize?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const siteUrl = typeof body.siteUrl === 'string' ? body.siteUrl.trim() : '';
    if (!siteUrl) {
      return NextResponse.json({ error: 'siteUrl is required (must match a property connected in GSC)' }, { status: 400 });
    }
    const batchSize = Math.min(MAX_BATCH_SIZE, Math.max(1, parseInt(body.batchSize, 10) || 100));

    const alreadyRunning = listInspectionJobs().find((j) => j.state === 'running');
    if (alreadyRunning) {
      return NextResponse.json({ error: 'An inspection batch is already running', jobId: alreadyRunning.id }, { status: 409 });
    }

    const job = createInspectionJob(siteUrl);
    startInspectionInBackground(job.id, siteUrl, batchSize);

    return NextResponse.json({ jobId: job.id, job: summarizeInspectionJob(job) });
  } catch (error) {
    console.error('Site audit inspection start error:', error);
    return NextResponse.json({ error: 'Failed to start inspection' }, { status: 500 });
  }
}

/**
 * List recent inspection jobs plus today's quota usage.
 * GET /api/admin/site-audit/inspect
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const usedToday = await getInspectionQuotaUsedToday();
    return NextResponse.json({
      jobs: listInspectionJobs().map(summarizeInspectionJob),
      quota: { used: usedToday, total: DAILY_QUOTA, remaining: Math.max(0, DAILY_QUOTA - usedToday) },
    });
  } catch (error) {
    console.error('Site audit inspection list error:', error);
    return NextResponse.json({ error: 'Failed to list inspection jobs' }, { status: 500 });
  }
}
