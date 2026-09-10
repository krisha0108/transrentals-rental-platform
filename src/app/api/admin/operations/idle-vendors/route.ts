// GET ?filter=&dateFrom=&dateTo= — admin-wide "supply without demand":
// location+service combos with active approved vendors but ~zero inquiry
// volume in the period.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { getDateRange, getIdleVendorCoverage } from '@/lib/admin-operations';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const currentUser = await prisma.admin_users.findUnique({ where: { id: session.user.id } });
    if (!currentUser || !['SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'thisMonth';
    const dateFilter = getDateRange(filter, searchParams.get('dateFrom'), searchParams.get('dateTo'));
    const dateFilterObj = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || undefined;

    const result = await getIdleVendorCoverage(dateFilterObj, { page, limit, search });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Operations tracker idle-vendors fetch error', error);
    return NextResponse.json({ error: 'Failed to load idle vendor coverage', details: error?.message }, { status: 500 });
  }
}
