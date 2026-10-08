import { NextRequest, NextResponse } from 'next/server';
import { getVendorAuth } from '@/lib/auth/vendor-mobile-auth';
import logger from '@/lib/security/logger';
import {
  fetchVendorReviews,
  shortCustomerName,
  REVIEW_SERVICE_KEYS,
} from '@/lib/reviews/booking-reviews';

export const dynamic = 'force-dynamic';

/**
 * GET /api/vendor/reviews?page=1&limit=20&rating=5&service=bike
 *
 * What customers said about the trips this vendor ran, across every service
 * plus Wander. Works for the web dashboard session and the vendor app token.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getVendorAuth(request);
    if (!auth.authenticated || !auth.vendorId) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
    const ratingParam = parseInt(searchParams.get('rating') || '');
    const rating = ratingParam >= 1 && ratingParam <= 5 ? ratingParam : undefined;
    const serviceParam = searchParams.get('service') || '';
    const service = REVIEW_SERVICE_KEYS.includes(serviceParam) ? serviceParam : undefined;

    const { summary, reviews, filteredTotal } = await fetchVendorReviews(auth.vendorId, {
      page,
      limit,
      rating,
      service,
    });

    return NextResponse.json({
      success: true,
      summary,
      reviews: reviews.map((r) => ({
        id: r.id,
        source: r.source,
        serviceLabel: r.serviceLabel,
        bookingId: r.bookingId,
        bookingNumber: r.bookingNumber,
        rating: r.rating,
        review: r.review,
        subRatings: r.subRatings,
        customerName: shortCustomerName(r.customerName),
        tripDate: r.tripDate ? r.tripDate.toISOString() : null,
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
      })),
      page,
      totalPages: Math.max(1, Math.ceil(filteredTotal / limit)),
    });
  } catch (error) {
    logger.error('Vendor reviews error', error);
    return NextResponse.json({ success: false, error: 'Failed to load reviews' }, { status: 500 });
  }
}
