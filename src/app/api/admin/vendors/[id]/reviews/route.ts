import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { fetchVendorReviews, REVIEW_SERVICE_KEYS } from '@/lib/reviews/booking-reviews';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/vendors/[id]/reviews?page=1&limit=20&rating=&service=
 *
 * The same reviews the vendor sees on their own page, with the customer's
 * full name and each review's moderation status. Wander reviews are included
 * whatever their status.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin_users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (!admin || !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(admin.role)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { id: vendorId } = await params;
    const vendor = await prisma.vendors.findUnique({
      where: { id: vendorId },
      select: { id: true, businessName: true, rating: true, totalRatings: true },
    });
    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20));
    const ratingParam = parseInt(searchParams.get('rating') || '');
    const rating = ratingParam >= 1 && ratingParam <= 5 ? ratingParam : undefined;
    const serviceParam = searchParams.get('service') || '';
    const service = REVIEW_SERVICE_KEYS.includes(serviceParam) ? serviceParam : undefined;

    const { summary, reviews, filteredTotal } = await fetchVendorReviews(vendorId, {
      page,
      limit,
      rating,
      service,
      allWanderStatuses: true,
    });

    return NextResponse.json({
      success: true,
      vendor,
      summary,
      reviews: reviews.map((r) => ({
        ...r,
        tripDate: r.tripDate ? r.tripDate.toISOString() : null,
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
      })),
      page,
      totalPages: Math.max(1, Math.ceil(filteredTotal / limit)),
    });
  } catch (error) {
    logger.error('Admin vendor reviews error', error);
    return NextResponse.json({ success: false, error: 'Failed to load reviews' }, { status: 500 });
  }
}
