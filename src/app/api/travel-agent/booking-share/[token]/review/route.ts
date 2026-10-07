import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { checkRateLimit, RATE_LIMITS, logger } from '@/lib/security';
import { notifyTravelAgent } from '@/lib/notifications/travel-agent-notify';

export const dynamic = 'force-dynamic';

// PUBLIC — a customer rates a completed PROPERTY stay from their own
// booking-share link. One review per booking (enforced by the unique
// constraint on travel_agent_property_reviews.bookingId); the property's
// precomputed rating/totalRatings are recalculated in the same transaction
// so public listing pages never need to aggregate reviews on read.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { limited, resetIn } = checkRateLimit(request, RATE_LIMITS.contact, 'booking-share-review');
  if (limited) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(resetIn) } },
    );
  }

  try {
    const { token } = await params;
    const booking = await prisma.travel_agent_bookings.findUnique({
      where: { shareToken: token },
      include: {
        travel_agents: { select: { status: true } },
        travel_agent_property_review: { select: { id: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking link is invalid' }, { status: 404 });
    }
    if (booking.shareExpiresAt && new Date(booking.shareExpiresAt) < new Date()) {
      return NextResponse.json({ error: 'This booking link has expired.' }, { status: 410 });
    }
    if (['BLOCKED', 'SUSPENDED', 'REJECTED'].includes(booking.travel_agents.status)) {
      return NextResponse.json({ error: 'This booking link is no longer available.' }, { status: 403 });
    }
    if (booking.bookingType !== 'PROPERTY' || !booking.referenceId) {
      return NextResponse.json({ error: 'This booking is not eligible for a stay review.' }, { status: 400 });
    }
    if (booking.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'You can rate your stay once the booking is marked completed.' }, { status: 400 });
    }
    if (booking.travel_agent_property_review) {
      return NextResponse.json({ error: 'You have already reviewed this stay.' }, { status: 409 });
    }

    const body = await request.json();
    const rating = Number(body?.rating);
    const comment = typeof body?.comment === 'string' ? body.comment.trim().slice(0, 2000) : null;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be a whole number from 1 to 5.' }, { status: 400 });
    }

    const property = await prisma.travel_agent_properties.findUnique({
      where: { id: booking.referenceId },
      select: { id: true, name: true, travelAgentId: true },
    });
    if (!property) {
      return NextResponse.json({ error: 'The property for this booking no longer exists.' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.travel_agent_property_reviews.create({
        data: {
          propertyId: property.id,
          bookingId: booking.id,
          customerName: booking.customerName,
          rating,
          comment: comment || null,
        },
      });

      const agg = await tx.travel_agent_property_reviews.aggregate({
        where: { propertyId: property.id },
        _avg: { rating: true },
        _count: { _all: true },
      });

      await tx.travel_agent_properties.update({
        where: { id: property.id },
        data: {
          rating: agg._avg.rating ?? rating,
          totalRatings: agg._count._all,
        },
      });
    });

    await notifyTravelAgent(property.travelAgentId, {
      type: 'BOOKING',
      title: 'New stay review',
      body: `${booking.customerName} rated ${property.name} ${rating}/5 for booking ${booking.bookingNumber}.`,
      link: `/travel-agent/properties/${property.id}`,
      metadata: { bookingId: booking.id, propertyId: property.id, rating },
      push: false,
    });

    return NextResponse.json({ success: true, message: 'Thanks for rating your stay!' });
  } catch (error: any) {
    logger.error('Booking-share review POST error', error);
    return NextResponse.json(
      { error: 'Failed to submit review', details: error?.message },
      { status: 500 },
    );
  }
}
