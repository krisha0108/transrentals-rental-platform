import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { REFUND_STATUSES, sourceFor } from '@/lib/refunds/refund-sources';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/refunds?status=pending&search=&page=1
 *
 * The refunds queue: every cancelled booking that owes a customer money,
 * across all services, in one list. Admins and managers both work it.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (!user || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    // Drives which actions the queue shows — managers review and hand off,
    // only admins actually move money. See PATCH .../[id] for the same rule.
    const viewerRole = user.role as 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER';

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'pending').toUpperCase();
    const search = searchParams.get('search')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')));

    const where: any = {};
    if (REFUND_STATUSES.includes(status as any)) where.status = status;
    if (search) {
      where.OR = [
        { bookingNumber: { contains: search } },
        { customerName: { contains: search } },
        { serviceType: { contains: search } },
      ];
    }

    const countWhere = search ? { OR: where.OR } : {};

    const [rows, total, pending, managerReviewed, processing, completed, failed, notRequired] = await Promise.all([
      prisma.refund_followups.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.refund_followups.count({ where }),
      prisma.refund_followups.count({ where: { ...countWhere, status: 'PENDING' } }),
      prisma.refund_followups.count({ where: { ...countWhere, status: 'MANAGER_REVIEWED' } }),
      prisma.refund_followups.count({ where: { ...countWhere, status: 'PROCESSING' } }),
      prisma.refund_followups.count({ where: { ...countWhere, status: 'COMPLETED' } }),
      prisma.refund_followups.count({ where: { ...countWhere, status: 'FAILED' } }),
      prisma.refund_followups.count({ where: { ...countWhere, status: 'NOT_REQUIRED' } }),
    ]);

    // Money still owed, so the desk can see the exposure at a glance. A
    // manager-approved amount supersedes the original snapshot once one exists.
    const owedRows = await prisma.refund_followups.findMany({
      where: { status: { in: ['PENDING', 'MANAGER_REVIEWED', 'PROCESSING', 'FAILED'] } },
      select: { amount: true, approvedAmount: true },
    });
    const outstandingAmount = owedRows.reduce((sum, r) => sum + (r.approvedAmount ?? r.amount), 0);

    return NextResponse.json({
      viewerRole,
      refunds: rows.map((r) => ({
        ...r,
        // Whether this service can be refunded through the gateway from here.
        gateway: sourceFor(r.source)?.gateway ?? false,
      })),
      counts: {
        pending,
        managerReviewed,
        processing,
        completed,
        failed,
        notRequired,
        outstandingAmount,
      },
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    logger.error('List refunds error', error);
    return NextResponse.json({ error: 'Failed to load refunds' }, { status: 500 });
  }
}
