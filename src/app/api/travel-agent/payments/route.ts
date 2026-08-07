// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getTravelAgentAuth } from '@/lib/auth/travel-agent-auth';
import logger from '@/lib/security/logger';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'];
// Virtual filter — customers who have paid the advance and still owe a balance
const ADVANCE_PAID_FILTER = 'ADVANCE_PAID';

// GET /api/travel-agent/payments
//   ?status=SUBMITTED|VERIFIED|REJECTED|PENDING|ADVANCE_PAID
//        ADVANCE_PAID = paymentStatus=VERIFIED AND balance > 0 (half-paid)
//   ?q=<search>                — search customer name/phone or txnId
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD — submission/acceptance date range
// Returns: { stats, items[] }
export async function GET(request: NextRequest) {
  try {
    const auth = await getTravelAgentAuth(request);
    if (!auth.authenticated || !auth.travelAgentId) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const q = (searchParams.get('q') || '').trim();
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Base where: this agent's leads that have any payment activity
    const where: any = {
      travelAgentId: auth.travelAgentId,
      OR: [
        { customerAcceptedAt: { not: null } },
        { paymentStatus: { not: null } },
      ],
    };

    if (statusFilter && VALID_STATUSES.includes(statusFilter)) {
      where.paymentStatus = statusFilter;
      // remove the OR since we have an explicit status filter
      delete where.OR;
    } else if (statusFilter === ADVANCE_PAID_FILTER) {
      // Verified advance + balance still pending (post-filtered below)
      where.paymentStatus = 'VERIFIED';
      delete where.OR;
    }

    if (q) {
      where.AND = [
        {
          OR: [
            { customerName: { contains: q } },
            { customerPhone: { contains: q } },
            { paymentTxnId: { contains: q } },
          ],
        },
      ];
    }

    if (from || to) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            {
              paymentSubmittedAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
              },
            },
            {
              customerAcceptedAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
              },
            },
          ],
        },
      ];
    }

    const leads = await (prisma as any).travel_agent_leads.findMany({
      where,
      orderBy: [
        { paymentSubmittedAt: 'desc' },
        { customerAcceptedAt: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: 200,
    });

    // Resolve linked tour titles in a single query
    const tourIds = Array.from(
      new Set(leads.map((l: any) => l.tourId).filter(Boolean)),
    ) as string[];
    const tours = tourIds.length
      ? await (prisma as any).travel_agent_tours.findMany({
          where: { id: { in: tourIds } },
          select: { id: true, title: true },
        })
      : [];
    const tourTitleById = new Map<string, string>(
      tours.map((t: any) => [t.id, t.title]),
    );

    let items = leads.map((l: any) => {
      let images: string[] = [];
      try {
        const arr = l.paymentProofImages ? JSON.parse(l.paymentProofImages) : [];
        if (Array.isArray(arr)) images = arr;
      } catch {}
      const hasQuote = l.quotedAmount != null;
      const advance = !hasQuote
        ? 0
        : l.quoteAdvanceAmount != null
          ? Number(l.quoteAdvanceAmount)
          : l.quoteAdvancePercent != null
            ? Math.round((Number(l.quotedAmount) * Number(l.quoteAdvancePercent)) / 100)
            : 0;
      return {
        id: l.id,
        customerName: l.customerName,
        customerPhone: l.customerPhone,
        customerEmail: l.customerEmail,
        tourTitle: l.tourId ? tourTitleById.get(l.tourId) || null : null,
        destination: l.destination,
        travelDate: l.travelDate,
        quotedAmount: l.quotedAmount,
        advanceAmount: hasQuote ? advance : null,
        balanceAmount:
          hasQuote ? Math.max(0, Number(l.quotedAmount) - advance) : null,
        leadStatus: l.status,
        paymentStatus: l.paymentStatus,
        paymentTxnId: l.paymentTxnId,
        paymentNote: l.paymentNote,
        paymentProofImages: images,
        customerAcceptedAt: l.customerAcceptedAt,
        paymentSubmittedAt: l.paymentSubmittedAt,
        paymentVerifiedAt: l.paymentVerifiedAt,
        paymentRejectReason: l.paymentRejectReason,
      };
    });

    // Post-filter for the virtual ADVANCE_PAID status (verified + balance > 0)
    if (statusFilter === ADVANCE_PAID_FILTER) {
      items = items.filter((it: any) => (it.balanceAmount ?? 0) > 0);
    }

    // Aggregate stats over ALL of agent's payment-active leads (not just the filtered set)
    const allForStats = await (prisma as any).travel_agent_leads.findMany({
      where: {
        travelAgentId: auth.travelAgentId,
        OR: [
          { customerAcceptedAt: { not: null } },
          { paymentStatus: { not: null } },
        ],
      },
      select: {
        paymentStatus: true,
        quotedAmount: true,
        quoteAdvanceAmount: true,
        quoteAdvancePercent: true,
      },
    });

    const calcAdv = (l: any) =>
      l.quoteAdvanceAmount != null
        ? Number(l.quoteAdvanceAmount)
        : l.quoteAdvancePercent != null && l.quotedAmount != null
          ? Math.round((Number(l.quotedAmount) * Number(l.quoteAdvancePercent)) / 100)
          : 0;

    const verifiedLeads = allForStats.filter((l: any) => l.paymentStatus === 'VERIFIED');
    const advancePaidLeads = verifiedLeads.filter(
      (l: any) =>
        l.quotedAmount &&
        Number(l.quotedAmount) - calcAdv(l) > 0,
    );

    const stats = {
      total: allForStats.length,
      pending: allForStats.filter((l: any) => l.paymentStatus === 'PENDING' || !l.paymentStatus).length,
      submitted: allForStats.filter((l: any) => l.paymentStatus === 'SUBMITTED').length,
      verified: verifiedLeads.length,
      rejected: allForStats.filter((l: any) => l.paymentStatus === 'REJECTED').length,
      advancePaid: advancePaidLeads.length,
      collectedAmount: verifiedLeads.reduce(
        (sum: number, l: any) => sum + (calcAdv(l) || 0),
        0,
      ),
      awaitingAmount: allForStats
        .filter((l: any) => l.paymentStatus === 'SUBMITTED')
        .reduce((sum: number, l: any) => sum + (calcAdv(l) || 0), 0),
      // Total balance still owed across all customers who've paid the advance
      pendingBalanceAmount: advancePaidLeads.reduce(
        (sum: number, l: any) =>
          sum + Math.max(0, Number(l.quotedAmount || 0) - (calcAdv(l) || 0)),
        0,
      ),
    };

    return NextResponse.json({ stats, items });
  } catch (error: any) {
    logger.error('List travel agent payments error', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments', details: error?.message },
      { status: 500 },
    );
  }
}
