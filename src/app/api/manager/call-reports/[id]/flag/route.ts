// Flag / unflag a single call-report row.
//
// Managers work off one shared sheet, and bad rows turn up constantly —
// duplicates, junk from a spreadsheet import, wrong numbers typed in a hurry.
// Flagging lets any manager mark such a row without destroying it; only an
// admin actually deletes it (see /api/admin/call-reports/[id]). That split is
// deliberate: a flag is reversible, a delete is not.
//
//   PATCH body: { isFlagged: boolean, flagReason?: string }
//     → { success, report: { id, isFlagged, flagReason, flaggedAt, flaggedById, flaggedByName } }

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { logCallReportFlag } from '@/lib/manager-call-report-log';

export const dynamic = 'force-dynamic';

const MAX_REASON = 500;

async function requireManager() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const role = (session.user as any).role;
  if (!['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) return null;
  return { id: session.user.id, name: session.user.name || null, role };
}

async function resolveParams(params: Promise<{ id: string }> | { id: string }) {
  return 'then' in params ? await params : params;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const manager = await requireManager();
    if (!manager) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }
    const { id } = await resolveParams(params);

    const existing = await prisma.manager_call_reports.findUnique({
      where: { id },
      select: { id: true, isFlagged: true, contactType: true },
    });
    if (!existing) return NextResponse.json({ error: 'Call report not found' }, { status: 404 });

    const body: any = await request.json().catch(() => ({}));
    if (typeof body?.isFlagged !== 'boolean') {
      return NextResponse.json({ error: 'isFlagged must be true or false' }, { status: 400 });
    }
    const isFlagged: boolean = body.isFlagged;
    const flagReason = isFlagged
      ? ((body?.flagReason || '').trim().slice(0, MAX_REASON) || null)
      : null;

    // Anyone on the sheet may flag, matching the shared-spreadsheet model the
    // quick status dropdown already follows. Clearing the flag stores nulls so
    // a re-flag never shows a stale reason from last time.
    const updated = await prisma.manager_call_reports.update({
      where: { id },
      data: {
        isFlagged,
        flagReason,
        flaggedAt: isFlagged ? new Date() : null,
        flaggedById: isFlagged ? manager.id : null,
      },
      select: { id: true, isFlagged: true, flagReason: true, flaggedAt: true, flaggedById: true },
    });

    await logCallReportFlag({
      actorId: manager.id,
      reportId: id,
      contactType: existing.contactType,
      flagged: isFlagged,
      reason: flagReason,
    });

    return NextResponse.json({
      success: true,
      report: { ...updated, flaggedByName: isFlagged ? manager.name : null },
    });
  } catch (error) {
    logger.error('Failed to flag manager call report', error);
    return NextResponse.json({ error: 'Failed to update flag' }, { status: 500 });
  }
}
