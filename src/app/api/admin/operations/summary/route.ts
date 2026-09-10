// GET ?filter=&dateFrom=&dateTo= — top-line KPI counts for the Operations
// Tracker overview tab. Keeps this cheap (counts only, no row payloads) so
// the overview loads fast; each tab's own route fetches the actual rows.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import {
  getDateRange, getUntouchedInquiries, getUntouchedBookings,
  getVendorsNeedingAction, getCoverageGaps, getIdleVendorCoverage, getPaymentFailures,
} from '@/lib/admin-operations';

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
    const filter = searchParams.get('filter') || 'today';
    const dateFilter = getDateRange(filter, searchParams.get('dateFrom'), searchParams.get('dateTo'));
    const dateFilterObj = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // The immediately-preceding window of the same length as the selected
    // period — e.g. filter=today compares against yesterday, filter=thisWeek
    // against the 7 days before this week. Lets the Overview tab show a
    // volume trend ("55 today vs 40 yesterday") instead of a bare count.
    // Undefined for 'all' (no natural "previous" window) or a one-sided
    // custom range.
    let previousDateFilterObj: { createdAt: { gte: Date; lte: Date } } | null = null;
    const periodEnd = (dateFilter as any).lte ?? (dateFilter as any).lt;
    if (dateFilter.gte && periodEnd) {
      const durationMs = periodEnd.getTime() - dateFilter.gte.getTime();
      const previousEnd = new Date(dateFilter.gte.getTime() - 1);
      const previousStart = new Date(previousEnd.getTime() - durationMs);
      previousDateFilterObj = { createdAt: { gte: previousStart, lte: previousEnd } };
    }

    // Only counts are needed here — limit:1 keeps the row payload minimal
    // (the underlying scan/diff cost is the same regardless, but there's no
    // reason to ship hundreds of rows back just to read a length).
    const [inquiries, bookings, vendorsNeedingAction, coverageGaps, idleVendors, paymentFailures, prevInquiries, prevBookings, prevPaymentFailures] = await Promise.all([
      getUntouchedInquiries(dateFilterObj, { limit: 1 }),
      getUntouchedBookings(dateFilterObj, { limit: 1 }),
      getVendorsNeedingAction(3, { limit: 1 }),
      getCoverageGaps(dateFilterObj, { limit: 1 }),
      getIdleVendorCoverage(dateFilterObj, { limit: 1 }),
      getPaymentFailures(dateFilterObj, { limit: 1 }),
      previousDateFilterObj ? getUntouchedInquiries(previousDateFilterObj, { limit: 1 }) : Promise.resolve(null),
      previousDateFilterObj ? getUntouchedBookings(previousDateFilterObj, { limit: 1 }) : Promise.resolve(null),
      previousDateFilterObj ? getPaymentFailures(previousDateFilterObj, { limit: 1 }) : Promise.resolve(null),
    ]);

    return NextResponse.json({
      filter,
      inquiries: { total: inquiries.total, actioned: inquiries.actioned, untouched: inquiries.untouchedTotal, previousTotal: prevInquiries?.total ?? null },
      bookings: { total: bookings.total, actioned: bookings.actioned, untouched: bookings.untouchedTotal, previousTotal: prevBookings?.total ?? null },
      vendorsNeedingAction: vendorsNeedingAction.total,
      coverageGaps: { total: coverageGaps.total, locations: coverageGaps.groupsTotal },
      idleVendorCoverage: idleVendors.total,
      paymentFailures: paymentFailures.total,
      paymentFailuresPrevious: prevPaymentFailures?.total ?? null,
    });
  } catch (error: any) {
    logger.error('Operations tracker summary fetch error', error);
    return NextResponse.json({ error: 'Failed to load operations summary', details: error?.message }, { status: 500 });
  }
}
