import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getJob, cancelJob, summarizeJob } from '@/lib/ai/bulk-job-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const job = getJob(params.jobId);
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  return NextResponse.json({ summary: summarizeJob(job) });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cancelled = cancelJob(params.jobId);
  if (!cancelled) {
    return NextResponse.json(
      { error: 'Job not found or already finished' },
      { status: 404 },
    );
  }

  const job = getJob(params.jobId);
  return NextResponse.json({
    success: true,
    summary: job ? summarizeJob(job) : null,
  });
}
