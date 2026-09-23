import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { parseBookingReviewId, fetchBookingReviews } from '@/lib/reviews/booking-reviews';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

async function requireModerator() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Unauthorized', status: 401 as const };

  const user = await prisma.admin_users.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, email: true },
  });
  if (!user || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
    return { error: 'Access denied', status: 403 as const };
  }
  return { user };
}

/** Reads the one decision both kinds of review share. */
function readDecision(body: Record<string, unknown>) {
  const decision: { status?: string; error?: string } = {};

  if (body.status !== undefined) {
    const status = String(body.status).toUpperCase();
    if (!ALLOWED_STATUSES.includes(status)) {
      decision.error = `status must be one of ${ALLOWED_STATUSES.join(', ')}`;
      return decision;
    }
    decision.status = status;
  }

  return decision;
}

/**
 * Records a decision about a review left on a booking. The booking row is
 * never touched — what the customer wrote is theirs — only whether the site
 * may show it.
 */
async function moderateBookingReview(
  booking: { source: string; bookingId: string },
  body: Record<string, unknown>,
  actor: { id: string; email: string }
) {
  const decision = readDecision(body);
  if (decision.error) {
    return NextResponse.json({ error: decision.error }, { status: 400 });
  }
  if (decision.status === undefined) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  // The id has to name a booking that exists and actually carries a review,
  // or the desk could create a decision about nothing.
  const [found] = await fetchBookingReviews({ limit: 1, only: [booking] });
  if (!found) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  const reviewedAt = new Date();

  const saved = await prisma.booking_review_moderation.upsert({
    where: { source_bookingId: { source: booking.source, bookingId: booking.bookingId } },
    create: {
      source: booking.source,
      bookingId: booking.bookingId,
      status: decision.status,
      reviewedAt,
      reviewedBy: actor.id,
    },
    update: { status: decision.status, reviewedAt, reviewedBy: actor.id },
  });

  logger.info('Booking review moderated', {
    reviewId: `${booking.source}:${booking.bookingId}`,
    status: saved.status,
    actorId: actor.id,
    actorEmail: actor.email,
  });

  return NextResponse.json({
    success: true,
    review: { ...found, status: saved.status, source: 'booking' },
  });
}

/**
 * PATCH /api/admin/reviews/[id]
 *
 * Approve or reject a submitted review. Approving is what puts it on the
 * public site, so who did it and when is recorded.
 *
 * An id of the form `car_bookings:abc123` is a review a customer left on a
 * booking. Those rows belong to the booking, not to the moderation desk, so
 * the decision is written to `booking_review_moderation` instead — the same
 * three states, kept beside the review rather than on it.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireModerator();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const booking = parseBookingReviewId(id);
    if (booking) {
      return moderateBookingReview(booking, body, auth.user);
    }

    const existing = await prisma.customer_reviews.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.status !== undefined) {
      const status = String(body.status).toUpperCase();
      if (!ALLOWED_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `status must be one of ${ALLOWED_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }
      data.status = status;
      data.reviewedAt = new Date();
      data.reviewedBy = auth.user.id;
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const updated = await prisma.customer_reviews.update({ where: { id }, data });

    logger.info('Customer review moderated', {
      reviewId: id,
      status: updated.status,
      actorId: auth.user.id,
      actorEmail: auth.user.email,
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    logger.error('Moderate customer review error', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/reviews/[id]
 *
 * For spam. Rejecting keeps the row for context; deleting is for what should
 * not have been stored at all. Only a review written from the site can be
 * deleted — one left on a booking is part of that booking's record, so the
 * strongest the desk can do there is reject it.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireModerator();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    if (parseBookingReviewId(id)) {
      return NextResponse.json(
        { error: 'A booking review is part of the booking and cannot be deleted. Reject it instead.' },
        { status: 400 }
      );
    }

    const existing = await prisma.customer_reviews.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    await prisma.customer_reviews.delete({ where: { id } });

    logger.info('Customer review deleted', {
      reviewId: id,
      actorId: auth.user.id,
      actorEmail: auth.user.email,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete customer review error', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
