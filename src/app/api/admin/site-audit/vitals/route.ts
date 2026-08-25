import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { createVitalsJob, summarizeVitalsJob, listVitalsJobs } from '@/lib/audit/vitals-job-store';
import { startVitalsInBackground } from '@/lib/audit/vitals-runner';
import { getApiKeyStatus, saveApiKey } from '@/lib/audit/pagespeed';

const MAX_BATCH_SIZE = 300;

/**
 * Start a Web Vitals (PageSpeed Insights) batch against pages our own
 * crawl found live (2xx).
 * POST /api/admin/site-audit/vitals
 * Body: { batchSize?: number, strategy?: 'mobile' | 'desktop', concurrency?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keyStatus = await getApiKeyStatus();
    if (!keyStatus.isConfigured) {
      return NextResponse.json({ error: 'PageSpeed Insights API key not configured' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const batchSize = Math.min(MAX_BATCH_SIZE, Math.max(1, parseInt(body.batchSize, 10) || 50));
    const strategy: 'mobile' | 'desktop' = body.strategy === 'desktop' ? 'desktop' : 'mobile';
    const concurrency = Math.max(1, Math.min(8, parseInt(body.concurrency, 10) || 3));

    const alreadyRunning = listVitalsJobs().find((j) => j.state === 'running');
    if (alreadyRunning) {
      return NextResponse.json({ error: 'A vitals check is already running', jobId: alreadyRunning.id }, { status: 409 });
    }

    const job = createVitalsJob(strategy, concurrency);
    startVitalsInBackground(job.id, batchSize);

    return NextResponse.json({ jobId: job.id, job: summarizeVitalsJob(job) });
  } catch (error) {
    console.error('Site audit vitals start error:', error);
    return NextResponse.json({ error: 'Failed to start vitals check' }, { status: 500 });
  }
}

/**
 * List recent vitals jobs plus whether an API key is configured.
 * GET /api/admin/site-audit/vitals
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keyStatus = await getApiKeyStatus();
    return NextResponse.json({ jobs: listVitalsJobs().map(summarizeVitalsJob), apiKey: keyStatus });
  } catch (error) {
    console.error('Site audit vitals list error:', error);
    return NextResponse.json({ error: 'Failed to list vitals jobs' }, { status: 500 });
  }
}

/**
 * Save a PageSpeed Insights API key (simple API key, no OAuth) — same
 * DB-backed alternative to an env var already used for the GSC OAuth
 * credentials.
 * PUT /api/admin/site-audit/vitals
 * Body: { apiKey: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
    if (!apiKey) return NextResponse.json({ error: 'apiKey is required' }, { status: 400 });

    await saveApiKey(apiKey);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Site audit vitals API key save error:', error);
    return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 });
  }
}
