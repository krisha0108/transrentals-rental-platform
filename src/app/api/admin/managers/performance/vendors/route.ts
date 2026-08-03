import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { getDateRange } from '@/lib/manager-performance';

export const dynamic = 'force-dynamic';

const vendorSelect = {
  id: true,
  businessName: true,
  ownerName: true,
  email: true,
  phone: true,
  city: true,
  status: true,
  createdAt: true,
  approvedAt: true,
} as const;

// GET — drill-down list of vendors a manager created and/or approved in a
// date range, for the "Vendors Created" / "Vendors Approved" stat cards on
// the Manager Performance detail page. ?managerId=&filter=&dateFrom=&dateTo=
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
    const hasRange = Object.keys(dateFilter).length > 0;

    const [created, approved] = await Promise.all([
      prisma.vendors.findMany({
        where: { createdById: managerId, ...(hasRange ? { createdAt: dateFilter } : {}) },
        select: vendorSelect,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vendors.findMany({
        where: { approvedById: managerId, ...(hasRange ? { approvedAt: dateFilter } : {}) },
        select: vendorSelect,
        orderBy: { approvedAt: 'desc' },
      }),
    ]);

    return NextResponse.json({ created, approved });
  } catch (error: any) {
    logger.error('Manager vendors drill-down fetch error', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors', details: error?.message },
      { status: 500 }
    );
  }
}
