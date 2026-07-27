import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { computeManagerStats, getDateRange } from '@/lib/manager-performance';

export const dynamic = 'force-dynamic';

// GET — single-manager drill-down: vendors created/approved, inquiry coverage,
// booking coverage, and action-type breakdown for a date range. Independent of
// the list endpoint's filter so the admin can flip Today/Yesterday for one
// manager without refetching everyone. ?managerId=&filter=&dateFrom=&dateTo=
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
    const managerId = searchParams.get('managerId');
    if (!managerId) {
      return NextResponse.json({ error: 'managerId is required' }, { status: 400 });
    }
    const filter = searchParams.get('filter') || 'today';
    const customFrom = searchParams.get('dateFrom');
    const customTo = searchParams.get('dateTo');
    const dateFilter = getDateRange(filter, customFrom, customTo);
    const dateFilterObj = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const manager = await prisma.admin_users.findUnique({
      where: { id: managerId },
      include: {
        manager_locations: { include: { locations: true } },
        manager_services: { include: { services: true } },
      },
    });
    if (!manager || manager.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    const stats = await computeManagerStats(manager, dateFilterObj);

    return NextResponse.json({
      filter,
      manager: {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        phone: manager.phone,
        isActive: manager.isActive,
        createdAt: manager.createdAt,
      },
      locations: manager.manager_locations.map((ml) => ml.locations).filter(Boolean),
      services: manager.manager_services.map((ms) => ms.services).filter(Boolean),
      ...stats,
    });
  } catch (error: any) {
    logger.error('Manager performance detail fetch error', error);
    return NextResponse.json(
      { error: 'Failed to fetch manager detail', details: error?.message },
      { status: 500 }
    );
  }
}
