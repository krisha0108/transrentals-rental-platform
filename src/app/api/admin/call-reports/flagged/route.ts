// Clear out flagged call reports in one go.
//
// After a bad spreadsheet import a manager can flag dozens of rows at once,
// and deleting them one request at a time is both slow and easy to abandon
// half-finished. This deletes exactly the set the admin is looking at.
//
//   DELETE body: { ids?: string[] }
//     ids given  → delete those ids, but only the flagged ones among them
//     ids absent → delete every flagged report
//     → { success, deleted: number }

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { requireAdmin } from '@/lib/auth/require-admin';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const body: any = await request.json().catch(() => ({}));
    const ids: string[] | null = Array.isArray(body?.ids)
      ? [...new Set<string>(body.ids.filter((v: any) => typeof v === 'string' && v))]
      : null;

    if (ids && ids.length === 0) {
      return NextResponse.json({ error: 'No call reports selected' }, { status: 400 });
    }

    // isFlagged stays in the where clause even when explicit ids are given —
    // an id list from a stale page must never be able to take an unflagged
    // report with it.
    const where = { isFlagged: true, ...(ids ? { id: { in: ids } } : {}) };

    const { count } = await prisma.manager_call_reports.deleteMany({ where });

    logger.info(`Admin ${admin.id} deleted ${count} flagged call report(s)${ids ? ` from a selection of ${ids.length}` : ' (all flagged)'}`);

    return NextResponse.json({ success: true, deleted: count });
  } catch (error) {
    logger.error('Failed to bulk delete flagged call reports', error);
    return NextResponse.json({ error: 'Failed to delete flagged call reports' }, { status: 500 });
  }
}
