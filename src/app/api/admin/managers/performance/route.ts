import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { computeManagerStats, getDateRange } from '@/lib/manager-performance';

export const dynamic = 'force-dynamic';

// GET — per-manager inquiry/booking/vendor activity for a date range. Powers
// the admin "Manager Performance" tracking page (list + summary cards).
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'today';
    const customFrom = searchParams.get('dateFrom');
    const customTo = searchParams.get('dateTo');
    const dateFilter = getDateRange(filter, customFrom, customTo);
    const dateFilterObj = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const managers = await prisma.admin_users.findMany({
      where: { role: 'MANAGER' },
      include: {
        manager_locations: { include: { locations: true } },
        manager_services: { include: { services: true } },
      },
      orderBy: { name: 'asc' },
    });

    const results = await Promise.all(managers.map(async (manager) => {
      const stats = await computeManagerStats(manager, dateFilterObj);
      return {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        ...stats,
      };
    }));

    // Sort by lowest inquiry coverage first — surfaces managers who need attention.
    results.sort((a, b) => {
      const aPct = a.inquiries.coveragePct ?? 101;
      const bPct = b.inquiries.coveragePct ?? 101;
      return aPct - bPct;
    });

    return NextResponse.json({ filter, managers: results });
  } catch (error: any) {
    logger.error('Manager performance fetch error', error);
    return NextResponse.json(
      { error: 'Failed to fetch manager performance', details: error?.message },
      { status: 500 }
    );
  }
}
