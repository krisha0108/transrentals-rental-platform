// Manager queue for vendor partnership agreements.
//
//   GET   ?status=pending|accepted|rejected|all&term=<months|all>&q=<search>&limit=<n>
//           → { items, counts: { pending, accepted, rejected, all } }
//   PATCH body: { id, action: 'accept' | 'reject', note? }
//           → { success, agreement }
//
// A vendor can sign at any time from their dashboard; the partnership only
// counts as in force once a manager accepts it here.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { sendVendorDirectNotification } from '@/lib/utils/vendor-notification-sender';

export const dynamic = 'force-dynamic';

async function requireManager() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const role = (session.user as any).role;
  if (!['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) return null;
  return { id: session.user.id, name: session.user.name || null, role };
}

const STATUS_BY_FILTER: Record<string, string | undefined> = {
  pending: 'PENDING',
  accepted: 'ACCEPTED',
  rejected: 'REJECTED',
  all: undefined,
};

export async function GET(request: NextRequest) {
  try {
    const manager = await requireManager();
    if (!manager) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = (searchParams.get('status') || 'all').toLowerCase();
    const termRaw = (searchParams.get('term') || 'all').toLowerCase();
    const termMonths = termRaw === 'all' ? null : Number(termRaw);
    const q = (searchParams.get('q') || '').trim();
    const limitRaw = Number(searchParams.get('limit'));
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(100, Math.floor(limitRaw)) : 50;

    const reviewStatus = STATUS_BY_FILTER[filter];
    const where: any = {};
    if (reviewStatus) where.reviewStatus = reviewStatus;
    if (termMonths && Number.isFinite(termMonths)) where.termMonths = termMonths;

    const rows = await (prisma as any).vendor_partnership_agreements.findMany({
      where,
      orderBy: [{ reviewStatus: 'asc' }, { acceptedAt: 'desc' }],
      take: limit,
    });

    // vendor_partnership_agreements has no relation to vendors, so the
    // business details are stitched in with one extra lookup.
    const vendorIds = [...new Set(rows.map((r: any) => r.vendorId))];
    const vendors = vendorIds.length
      ? await prisma.vendors.findMany({
          where: { id: { in: vendorIds as string[] } },
          select: { id: true, businessName: true, vid: true, email: true, phone: true, city: true, status: true, logo: true },
        })
      : [];
    const vendorById = new Map(vendors.map((v) => [v.id, v]));

    // Same for the reviewing manager's name.
    const reviewerIds = [...new Set(rows.map((r: any) => r.reviewedById).filter(Boolean))];
    const reviewers = reviewerIds.length
      ? await prisma.admin_users.findMany({
          where: { id: { in: reviewerIds as string[] } },
          select: { id: true, name: true },
        })
      : [];
    const reviewerById = new Map(reviewers.map((r) => [r.id, r.name]));

    let items = rows.map((r: any) => ({
      id: r.id,
      vendorId: r.vendorId,
      vendor: vendorById.get(r.vendorId) || null,
      agreementVersion: r.agreementVersion,
      signedByName: r.signedByName,
      signedByTitle: r.signedByTitle,
      queryNote: r.queryNote,
      termMonths: r.termMonths,
      acceptedAt: r.acceptedAt,
      ipAddress: r.ipAddress,
      reviewStatus: r.reviewStatus,
      reviewedAt: r.reviewedAt,
      reviewNote: r.reviewNote,
      reviewedByName: r.reviewedById ? reviewerById.get(r.reviewedById) || null : null,
    }));

    if (q) {
      const needle = q.toLowerCase();
      items = items.filter((i: any) =>
        (i.vendor?.businessName || '').toLowerCase().includes(needle) ||
        (i.vendor?.vid || '').toLowerCase().includes(needle) ||
        (i.signedByName || '').toLowerCase().includes(needle),
      );
    }

    const grouped = await (prisma as any).vendor_partnership_agreements.groupBy({
      by: ['reviewStatus'],
      _count: { _all: true },
      // Scoped to the chosen term so the dropdown counts match what the list
      // actually shows.
      ...(termMonths && Number.isFinite(termMonths) ? { where: { termMonths } } : {}),
    });
    const counts = { pending: 0, accepted: 0, rejected: 0, all: 0 };
    grouped.forEach((g: any) => {
      const key = String(g.reviewStatus).toLowerCase() as keyof typeof counts;
      if (key in counts) counts[key] = g._count._all;
      counts.all += g._count._all;
    });

    return NextResponse.json({ items, counts });
  } catch (error) {
    logger.error('Failed to list vendor partnership agreements', error);
    return NextResponse.json({ error: 'Failed to load agreements' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const manager = await requireManager();
    if (!manager) {
      return NextResponse.json({ error: 'Access denied. Manager role required.' }, { status: 403 });
    }

    const body = await request.json();
    const id = (body?.id || '').trim();
    const action = (body?.action || '').trim().toLowerCase();
    const note = (body?.note || '').trim() || null;

    if (!id) return NextResponse.json({ error: 'Agreement id is required' }, { status: 400 });
    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be accept or reject' }, { status: 400 });
    }
    if (action === 'reject' && !note) {
      return NextResponse.json({ error: 'Please add a reason when rejecting' }, { status: 400 });
    }

    const existing = await (prisma as any).vendor_partnership_agreements.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });

    // An agreement is reviewed once. Two managers can have this queue open at
    // the same time, and a page that hasn't refreshed still shows the buttons
    // — so the decision is enforced here rather than only hidden in the UI.
    if (existing.reviewStatus !== 'PENDING') {
      const reviewer = existing.reviewedById
        ? await prisma.admin_users.findUnique({
            where: { id: existing.reviewedById },
            select: { name: true },
          })
        : null;
      const on = existing.reviewedAt
        ? new Date(existing.reviewedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        : null;
      return NextResponse.json(
        {
          error:
            `This agreement was already ${existing.reviewStatus.toLowerCase()}` +
            `${reviewer?.name ? ` by ${reviewer.name}` : ''}${on ? ` on ${on}` : ''}.`,
          alreadyReviewed: true,
          agreement: existing,
        },
        { status: 409 },
      );
    }

    const updated = await (prisma as any).vendor_partnership_agreements.update({
      where: { id },
      data: {
        reviewStatus: action === 'accept' ? 'ACCEPTED' : 'REJECTED',
        reviewedAt: new Date(),
        reviewedById: manager.id,
        reviewNote: note,
      },
    });

    // Tell the vendor what TransRentals decided — in-app notification plus a
    // push to their devices. Best-effort: the review itself has already been
    // saved, so a notification failure must not fail the request.
    try {
      const accepted = action === 'accept';
      await sendVendorDirectNotification({
        vendorId: existing.vendorId,
        type: accepted ? 'agreement_approved' : 'agreement_rejected',
        serviceType: 'agreement',
        title: accepted
          ? 'Agreement approved by TransRentals'
          : 'Agreement rejected by TransRentals',
        body: accepted
          ? `Your partnership agreement (${existing.agreementVersion}) has been approved` +
            `${note ? `: ${note}` : '. Your partnership is now in force.'}`
          : `${note || 'Your signature was not accepted.'} Please review and sign the agreement again.`,
        data: {
          screen: 'PartnershipAgreement',
          link: '/vendor/partnership-agreement',
          agreementId: existing.id,
          agreementVersion: existing.agreementVersion,
          reviewStatus: accepted ? 'ACCEPTED' : 'REJECTED',
        },
      });
    } catch (error) {
      logger.error('Failed to notify vendor of a partnership agreement review', error);
    }

    return NextResponse.json({ success: true, agreement: updated });
  } catch (error) {
    logger.error('Failed to review a vendor partnership agreement', error);
    return NextResponse.json({ error: 'Failed to update the agreement' }, { status: 500 });
  }
}
