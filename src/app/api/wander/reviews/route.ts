// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET - Fetch reviews for a listing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');

    // bookingId check — return whether review exists for this booking
    const bookingId = searchParams.get('bookingId');
    if (bookingId) {
      const existing = await (prisma as any).wander_reviews.findUnique({
        where: { bookingId },
        select: { id: true, rating: true, title: true, review: true, createdAt: true, vendorReply: true, vendorRepliedAt: true },
      });
      return NextResponse.json({ exists: !!existing, review: existing || null });
    }

    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 });

    const where: any = { listingId, status: 'ACTIVE' };

    const [reviews, total] = await Promise.all([
      (prisma as any).wander_reviews.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (prisma as any).wander_reviews.count({ where }),
    ]);

    // Aggregate from ALL active reviews for this listing (not just this page)
    const allActive = await (prisma as any).wander_reviews.findMany({
      where,
      select: { rating: true },
    });

    const totalRatings = allActive.length;
    const avgRating = totalRatings > 0
      ? Math.round((allActive.reduce((sum: number, r: any) => sum + r.rating, 0) / totalRatings) * 10) / 10
      : 0;

    // Distribution per star level
    const distribution = [5, 4, 3, 2, 1].map((r) => ({
      rating: r,
      count: allActive.filter((rev: any) => rev.rating === r).length,
    }));

    return NextResponse.json({
      reviews,
      totalRatings,
      avgRating,
      distribution,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[Wander Reviews GET]', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST - Submit a review (customer, must have completed booking)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, rating, title } = body;
    // The customer app sends `comment` and the quote request id rather than
    // `review` and the booking id; accept both shapes.
    const review = body.review ?? body.comment;
    let bookingId = body.bookingId;
    if (!bookingId && body.quoteRequestId && customerId) {
      const linked = await (prisma as any).wander_bookings.findFirst({
        where: { quoteRequestId: body.quoteRequestId, customerId },
        select: { id: true },
      });
      bookingId = linked?.id;
    }

    if (!customerId) return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    if (!bookingId) return NextResponse.json({ error: 'Booking not found for this trip' }, { status: 400 });
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Verify booking exists, belongs to customer, and is COMPLETED
    const booking = await (prisma as any).wander_bookings.findFirst({
      where: { id: bookingId, customerId, status: 'COMPLETED' },
      include: { quoteRequest: { select: { wanderListingId: true } } },
    });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or not yet completed' }, { status: 404 });
    }

    // Check if already reviewed
    const existing = await (prisma as any).wander_reviews.findUnique({
      where: { bookingId },
    });
    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this booking' }, { status: 400 });
    }

    const listingId = booking.listingId || booking.quoteRequest?.wanderListingId;
    if (!listingId) {
      return NextResponse.json({ error: 'Listing not found for this booking' }, { status: 400 });
    }

    const newReview = await (prisma as any).wander_reviews.create({
      data: {
        id: 'rev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        listingId,
        bookingId,
        customerId,
        rating: parseInt(rating),
        title: title?.trim() || null,
        review: review?.trim() || null,
        isVerified: true,
        status: 'ACTIVE',
      },
    });

    // Recalculate listing average rating from all ACTIVE reviews
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

    return NextResponse.json({ success: true, review: newReview }, { status: 201 });
  } catch (error) {
    console.error('[Wander Reviews POST]', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
