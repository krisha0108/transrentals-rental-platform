import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getCrawlJob, summarizeCrawlJob, cancelCrawlJob } from '@/lib/audit/crawl-job-store';

/**
 * Poll a crawl job's progress.
 * GET /api/admin/site-audit/crawl/[jobId]
 */
export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const job = getCrawlJob(params.jobId);
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  return NextResponse.json(summarizeCrawlJob(job));
}

/**
 * Cancel an in-progress crawl.
 * DELETE /api/admin/site-audit/crawl/[jobId]
 */
export async function DELETE(request: NextRequest, { params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cancelled = cancelCrawlJob(params.jobId);
  if (!cancelled) return NextResponse.json({ error: 'Job not found or already finished' }, { status: 404 });

  return NextResponse.json({ success: true });
}
