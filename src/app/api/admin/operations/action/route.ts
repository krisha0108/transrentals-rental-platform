// POST — lightweight, generic action logger for the Operations Tracker's
// inline row actions ("Mark Called" / "Add Note") on untouched inquiries,
// bookings, and vendors. Unlike the domain-specific manager routes
// (/api/manager/inquiries/[id], /api/manager/bookings/[id], etc.), this is a
// pure manager_action_logs insert — no side effects on the underlying
// inquiry/booking/vendor row. That's intentional: logging any action here is
// exactly what "untouched" detection in admin-operations.ts checks for, and
// the full workflow (status changes, notifications, etc.) still happens on
// each record's own detail page, which every row links out to.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const RECORD_TYPES = ['INQUIRY', 'BOOKING', 'VENDOR'] as const;
const ACTION_TYPES = ['CALLED', 'NOTE_ADDED', 'FOLLOW_UP'] as const;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const admin = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
    if (!admin || !['SUPER_ADMIN', 'ADMIN'].includes(admin.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const recordType = body?.recordType;
    const recordId = (body?.recordId || '').trim();
    const serviceType = (body?.serviceType || '').trim();
    const actionType = body?.actionType;
    const note = (body?.note || '').trim() || null;

    if (!RECORD_TYPES.includes(recordType)) {
      return NextResponse.json({ error: `recordType must be one of ${RECORD_TYPES.join(', ')}` }, { status: 400 });
    }
    if (!recordId) {
      return NextResponse.json({ error: 'recordId is required' }, { status: 400 });
    }
    if (!ACTION_TYPES.includes(actionType)) {
      return NextResponse.json({ error: `actionType must be one of ${ACTION_TYPES.join(', ')}` }, { status: 400 });
    }
    if (actionType === 'NOTE_ADDED' && !note) {
      return NextResponse.json({ error: 'note is required for NOTE_ADDED' }, { status: 400 });
    }

    const log = await prisma.manager_action_logs.create({
      data: {
        recordType,
        recordId,
        serviceType: serviceType || recordType.toLowerCase(),
        actionType,
        note,
        managerId: admin.id,
      },
    });

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    logger.error('Operations tracker action log failed', error);
    return NextResponse.json({ error: 'Failed to log action', details: error?.message }, { status: 500 });
  }
}
