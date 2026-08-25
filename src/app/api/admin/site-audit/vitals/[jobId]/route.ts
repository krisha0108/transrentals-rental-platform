import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getVitalsJob, summarizeVitalsJob, cancelVitalsJob } from '@/lib/audit/vitals-job-store';

/**
 * Poll a vitals job's progress.
 * GET /api/admin/site-audit/vitals/[jobId]
 */
export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const job = getVitalsJob(params.jobId);
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  return NextResponse.json(summarizeVitalsJob(job));
}

/**
 * Cancel an in-progress vitals batch.
 * DELETE /api/admin/site-audit/vitals/[jobId]
 */
export async function DELETE(request: NextRequest, { params }: { params: { jobId: string } }) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;
  if (!session || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cancelled = cancelVitalsJob(params.jobId);
  if (!cancelled) return NextResponse.json({ error: 'Job not found or already finished' }, { status: 404 });

  return NextResponse.json({ success: true });
}
