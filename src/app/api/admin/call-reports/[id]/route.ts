// Permanently delete one call report from the admin side.
//
// Guard rail: only a *flagged* row can be deleted here. A manager flags the
// row, an admin confirms it — two people, two steps, and no way to wipe a
// good report with a stray click. `?force=true` exists for the rare case an
// admin has to remove an unflagged row, and is spelled out in the request so
// it can never happen by accident.
//
//   DELETE ?force=true → { success, deleted: { id, vendorName } }

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { requireAdmin } from '@/lib/auth/require-admin';

export const dynamic = 'force-dynamic';

async function resolveParams(params: Promise<{ id: string }> | { id: string }) {
  return 'then' in params ? await params : params;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Access denied' }, { status: 403 });

    const { id } = await resolveParams(params);
    const force = new URL(request.url).searchParams.get('force') === 'true';

    const existing = await prisma.manager_call_reports.findUnique({
      where: { id },
      select: { id: true, vendorName: true, isFlagged: true, managerId: true, contactType: true },
    });
    if (!existing) return NextResponse.json({ error: 'Call report not found' }, { status: 404 });

    if (!existing.isFlagged && !force) {
      return NextResponse.json(
        { error: 'Only flagged call reports can be deleted. Flag it first, or pass force=true.' },
        { status: 400 },
      );
    }

    // The join rows cascade with the report; the action-log rows do not —
    // they are the audit trail of what the manager did, and that history has
    // to outlive the row it describes. They are re-pointed by recordId only,
    // so leaving them is safe.
    await prisma.manager_call_reports.delete({ where: { id } });

    logger.info(
      `Admin ${admin.id} deleted call report ${id} (${existing.vendorName}), flagged=${existing.isFlagged}, force=${force}`,
    );

    return NextResponse.json({
      success: true,
      deleted: { id: existing.id, vendorName: existing.vendorName },
    });
  } catch (error) {
    logger.error('Failed to delete call report', error);
    return NextResponse.json({ error: 'Failed to delete call report' }, { status: 500 });
  }
}
