import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET — has this vendor digitally signed the partnership agreement, and
// with what details? Used by the manager/admin vendor detail page.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes((session.user as any)?.role)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const vendorId = params.id;

  const agreements = await (prisma as any).vendor_partnership_agreements.findMany({
    where: { vendorId },
    orderBy: { acceptedAt: 'desc' },
  });

  // vendor_partnership_agreements has no relation to admin_users, so the
  // reviewing manager's name is stitched in with one extra lookup.
  const reviewerIds = [...new Set(agreements.map((a: any) => a.reviewedById).filter(Boolean))];
  const reviewers = reviewerIds.length
    ? await prisma.admin_users.findMany({
        where: { id: { in: reviewerIds as string[] } },
        select: { id: true, name: true },
      })
    : [];
  const nameById = new Map(reviewers.map((r) => [r.id, r.name]));

  const withReviewer = agreements.map((a: any) => ({
    ...a,
    reviewedByName: a.reviewedById ? nameById.get(a.reviewedById) || null : null,
  }));

  return NextResponse.json({
    signed: withReviewer.length > 0,
    latest: withReviewer[0] || null,
    history: withReviewer,
  });
}
