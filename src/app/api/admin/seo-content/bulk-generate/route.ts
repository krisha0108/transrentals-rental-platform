import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { createJob, summarizeJob, type BulkTarget } from '@/lib/ai/bulk-job-store';
import { startJobInBackground } from '@/lib/ai/bulk-runner';
import { SERVICE_LABELS } from '@/lib/ai/prompts/page-content';
import { getCityBySlug } from '@/data/indian-cities';
import { prisma } from '@/lib/db/prisma';

const MAX_TARGETS_PER_JOB = 1000;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const rawTargets: any[] = Array.isArray(body.targets) ? body.targets : [];
  if (rawTargets.length === 0) {
    return NextResponse.json({ error: 'targets array required' }, { status: 400 });
  }
  if (rawTargets.length > MAX_TARGETS_PER_JOB) {
    return NextResponse.json(
      { error: `Too many targets (max ${MAX_TARGETS_PER_JOB})` },
      { status: 400 },
    );
  }

  const validTargets: BulkTarget[] = [];
  const invalidTargets: Array<{ target: any; reason: string }> = [];

  // Pre-fetch active DB slugs for cities not in the static data
  const rawCitySlugs = rawTargets
    .filter((t) => t && typeof t.citySlug === 'string' && !getCityBySlug(t.citySlug))
    .map((t) => t.citySlug as string);
  const dbCitySlugs = new Set(
    rawCitySlugs.length
      ? (
          await prisma.locations.findMany({
            where: { slug: { in: rawCitySlugs }, isActive: true },
            select: { slug: true },
          })
        ).map((l) => l.slug)
      : [],
  );

  const seen = new Set<string>();
  for (const t of rawTargets) {
    if (!t || typeof t.serviceSlug !== 'string' || typeof t.citySlug !== 'string') {
      invalidTargets.push({ target: t, reason: 'missing serviceSlug or citySlug' });
      continue;
    }
    if (!(t.serviceSlug in SERVICE_LABELS)) {
      invalidTargets.push({ target: t, reason: `unknown serviceSlug "${t.serviceSlug}"` });
      continue;
    }
    if (!getCityBySlug(t.citySlug) && !dbCitySlugs.has(t.citySlug)) {
      invalidTargets.push({ target: t, reason: `unknown citySlug "${t.citySlug}"` });
      continue;
    }
    const key = `${t.serviceSlug}::${t.citySlug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    validTargets.push({ serviceSlug: t.serviceSlug, citySlug: t.citySlug });
  }

  if (validTargets.length === 0) {
    return NextResponse.json(
      { error: 'No valid targets', invalidTargets },
      { status: 400 },
    );
  }

  const job = createJob({
    targets: validTargets,
    customInstructions: typeof body.customInstructions === 'string' ? body.customInstructions : undefined,
    concurrency: typeof body.concurrency === 'number' ? body.concurrency : 5,
  });

  const userId = (session.user as any)?.id ?? null;
  const editor = userId ? `admin:${userId}` : 'admin:bulk';
  startJobInBackground(job.id, editor);

  return NextResponse.json({
    success: true,
    jobId: job.id,
    accepted: validTargets.length,
    rejected: invalidTargets.length,
    invalidTargets: invalidTargets.length > 0 ? invalidTargets : undefined,
    summary: summarizeJob(job),
  });
}
