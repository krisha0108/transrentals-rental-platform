// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import { vendorStatusGuard } from '@/lib/auth/vendor-status-guard';

export const dynamic = 'force-dynamic';

// PATCH - Vendor hide/show/reply to a review
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    // Block rejected/suspended/blocked vendors from write operations
    const _guard = await vendorStatusGuard(auth.vendorId!);
    if (_guard.blocked) return _guard.response;

    const reviewId = params.id;
    const body = await request.json();
    const { action, reply } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    // Fetch review with listing to verify ownership
    const review = await (prisma as any).wander_reviews.findUnique({
      where: { id: reviewId },
      include: { listing: { select: { id: true, vendorId: true } } },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.listing?.vendorId !== auth.vendorId) {
      return NextResponse.json({ error: 'Forbidden — you do not own this listing' }, { status: 403 });
    }

    let updateData: any = {};

    if (action === 'hide') {
      updateData.status = 'HIDDEN';
    } else if (action === 'show') {
      updateData.status = 'ACTIVE';
    } else if (action === 'reply') {
      if (!reply || !reply.trim()) {
        return NextResponse.json({ error: 'reply text is required' }, { status: 400 });
      }
      updateData.vendorReply = reply.trim();
      updateData.vendorRepliedAt = new Date();
    } else {
      return NextResponse.json({ error: 'Invalid action. Use hide, show, or reply' }, { status: 400 });
    }

    const updated = await (prisma as any).wander_reviews.update({
      where: { id: reviewId },
      data: updateData,
    });

    // Recalculate listing rating after hide/show
    if (action === 'hide' || action === 'show') {
      const listingId = review.listingId;
      const allActive = await (prisma as any).wander_reviews.findMany({
        where: { listingId, status: 'ACTIVE' },
        select: { rating: true },
      });
      const totalRatings = allActive.length;
      const avgRating = totalRatings > 0
        ? Math.round((allActive.reduce((sum: number, r: any) => sum + r.rating, 0) / totalRatings) * 10) / 10
        : 0;

      await (prisma as any).wander_listings.update({
        where: { id: listingId },
        data: { rating: avgRating, totalRatings },
      });
    }

    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    console.error('[Vendor Wander Reviews PATCH]', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}
