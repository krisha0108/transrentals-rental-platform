// GET ?filter=&maxVendors=&page=&limit=&search= — every (location, service)
// combo that got inquiries in the period, with how many approved vendors
// were there to serve it. Unlike coverage-gaps (log-based, only the true
// zero-vendor case), this is computed live so `maxVendors` can be any
// threshold — e.g. "demand sitting on fewer than 5 vendors".

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { getDateRange, getDemandCoverage } from '@/lib/admin-operations';

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
    const filter = searchParams.get('filter') || 'thisWeek';
    const dateFilter = getDateRange(filter, searchParams.get('dateFrom'), searchParams.get('dateTo'));
    const dateFilterObj = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || undefined;
    const maxVendorsRaw = searchParams.get('maxVendors');
    const maxVendors = maxVendorsRaw !== null && maxVendorsRaw !== '' ? Number(maxVendorsRaw) : undefined;

    const result = await getDemandCoverage(dateFilterObj, { page, limit, search, maxVendors });
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('Operations tracker demand-coverage fetch error', error);
    return NextResponse.json({ error: 'Failed to load demand coverage', details: error?.message }, { status: 500 });
  }
}
