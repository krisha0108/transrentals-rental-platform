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
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 });

    const where: any = { listingId, status: 'ACTIVE' };

    const [reviews, total, stats] = await Promise.all([
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
      (prisma as any).wander_reviews.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    // Rating distribution
    const distribution = await Promise.all(
      [5, 4, 3, 2, 1].map(async (r) => ({
        rating: r,
        count: await (prisma as any).wander_reviews.count({ where: { ...where, rating: r } }),
      }))
    );

    return NextResponse.json({
      reviews,
      total,
      avgRating: Math.round((stats._avg.rating || 0) * 10) / 10,
      totalRatings: stats._count.rating,
      distribution,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[Wander Reviews GET]', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST - Submit a review (customer only, must have completed booking)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, customerId, rating, title, review, images } = body;

    if (!bookingId || !customerId || !rating) {
      return NextResponse.json({ error: 'bookingId, customerId, and rating are required' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Verify booking exists, belongs to customer, and is COMPLETED
    const booking = await (prisma as any).wander_bookings.findFirst({
      where: { id: bookingId, customerId },
      include: { quoteRequest: { select: { wanderListingId: true } } },
    });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'You can only review completed tours' }, { status: 400 });
    }

    // Check if already reviewed
    const existing = await (prisma as any).wander_reviews.findUnique({
      where: { bookingId },
    });
    if (existing) return NextResponse.json({ error: 'You have already reviewed this booking' }, { status: 400 });

    const listingId = booking.quoteRequest?.wanderListingId;
    if (!listingId) return NextResponse.json({ error: 'Listing not found for this booking' }, { status: 400 });

    const newReview = await (prisma as any).wander_reviews.create({
      data: {
        listingId,
        bookingId,
        customerId,
        rating: parseInt(rating),
        title: title?.trim() || null,
        review: review?.trim() || null,
        images: images ? JSON.stringify(images) : null,
        isVerified: true,
        status: 'ACTIVE',
      },
    });

    // Update listing average rating
    const aggr = await (prisma as any).wander_reviews.aggregate({
      where: { listingId, status: 'ACTIVE' },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await (prisma as any).wander_listings.update({
      where: { id: listingId },
      data: {
        rating: Math.round((aggr._avg.rating || 0) * 10) / 10,
        totalRatings: aggr._count.rating,
      },
    });

    return NextResponse.json({ success: true, review: newReview }, { status: 201 });
  } catch (error) {
    console.error('[Wander Reviews POST]', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
