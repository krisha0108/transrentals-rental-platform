import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/security/logger';
import { fetchBookingReviews } from '@/lib/reviews/booking-reviews';

export const dynamic = 'force-dynamic';

/**
 * Both queues are small — a site that has taken thousands of reviews would
 * want this paged in SQL, but merging two very different stores in the
 * database would cost more than it saves at this size. The cap is a guard,
 * not a page size.
 */
const MAX_MERGED = 1000;

/** One row of the moderation queue, whichever store it came from. */
type QueueItem = {
  id: string;
  /** 'site' = written from the homepage form; 'booking' = left after a trip. */
  source: 'site' | 'booking';
  /** Which booking table it came from, for a booking review. */
  bookingTable: string | null;
  bookingNumber: string | null;
  /** The vendor who ran the booking, for a booking review. */
  vendorId: string | null;
  vendorName: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  service: string | null;
  rating: number;
  comment: string;
  tags: string | null;
  photos: string | null;
  status: string;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  createdAt: Date;
  /** Only a site review can be deleted — a booking review is part of the booking. */
  canDelete: boolean;
};

/**
 * GET /api/admin/reviews?status=pending&page=1&limit=20&search=&vendorId=
 *
 * The moderation queue, holding both kinds of review the site collects:
 * what visitors write from the homepage form (`customer_reviews`), and the
 * rating a customer left on a booking they took, which lives in that
 * service's own booking table. A booking review carries no status of its own,
 * so its decision is kept in `booking_review_moderation`; until someone makes
 * one it counts as PENDING and stays off the site, the same as any other
 * unreviewed submission.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'pending').toUpperCase();
    const source = (searchParams.get('source') || 'all').toLowerCase();
    const search = searchParams.get('search')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    // A vendor's reviews are only ever booking reviews, so this drops site reviews too.
    const vendorId = searchParams.get('vendorId')?.trim() || '';

    const [siteRows, bookingRows, decisions] = await Promise.all([
      vendorId
        ? Promise.resolve([])
        : prisma.customer_reviews.findMany({
            orderBy: [{ createdAt: 'desc' }],
            take: MAX_MERGED,
          }),
      fetchBookingReviews({ limit: MAX_MERGED, vendorId: vendorId || undefined }),
      prisma.booking_review_moderation.findMany({ take: MAX_MERGED }),
    ]);

    // The decision, if one was ever made, keyed the same way the id is built.
    const decisionByKey = new Map(
      decisions.map((d) => [`${d.source}:${d.bookingId}`, d])
    );

    const vendorIds = [...new Set(bookingRows.map((r) => r.vendorId).filter((v): v is string => !!v))];
    const vendors = vendorIds.length
      ? await prisma.vendors.findMany({
          where: { id: { in: vendorIds } },
          select: { id: true, businessName: true },
        })
      : [];
    const vendorNameById = new Map(vendors.map((v) => [v.id, v.businessName]));

    const siteItems: QueueItem[] = siteRows.map((r) => ({
      id: r.id,
      source: 'site',
      bookingTable: null,
      bookingNumber: null,
      vendorId: null,
      vendorName: null,
      name: r.name,
      email: r.email,
      phone: r.phone,
      city: r.city,
      service: r.service,
      rating: r.rating,
      comment: r.comment,
      tags: r.tags,
      photos: r.photos,
      status: r.status,
      reviewedAt: r.reviewedAt,
      reviewedBy: r.reviewedBy,
      createdAt: r.createdAt,
      canDelete: true,
    }));

    const bookingItems: QueueItem[] = bookingRows.map((r) => {
      const decision = decisionByKey.get(r.id);
      return {
        id: r.id,
        source: 'booking',
        bookingTable: r.source,
        bookingNumber: r.bookingNumber,
        vendorId: r.vendorId,
        vendorName: r.vendorId ? vendorNameById.get(r.vendorId) ?? null : null,
        name: r.name,
        email: r.email,
        phone: r.phone,
        city: r.city,
        service: r.service,
        rating: r.rating,
        comment: r.comment,
        tags: null,
        photos: null,
        // No row yet means nobody has looked at it — which is what pending is.
        status: decision?.status ?? 'PENDING',
        reviewedAt: decision?.reviewedAt ?? null,
        reviewedBy: decision?.reviewedBy ?? null,
        createdAt: r.createdAt,
        canDelete: false,
      };
    });

    const merged = [...siteItems, ...bookingItems].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    const needle = search.toLowerCase();
    const matchesSearch = (item: QueueItem) =>
      !needle ||
      [item.name, item.comment, item.city, item.email, item.phone, item.bookingNumber].some((f) =>
        f?.toLowerCase().includes(needle)
      );

    const searched = merged.filter(matchesSearch);

    // Counts are taken after the search but before the status tab, so each tab
    // keeps showing the real size of its own queue.
    const counts = {
      pending: searched.filter((r) => r.status === 'PENDING').length,
      approved: searched.filter((r) => r.status === 'APPROVED').length,
      rejected: searched.filter((r) => r.status === 'REJECTED').length,
      site: searched.filter((r) => r.source === 'site').length,
      booking: searched.filter((r) => r.source === 'booking').length,
    };

    const filtered = searched.filter((r) => {
      const statusOk = ['PENDING', 'APPROVED', 'REJECTED'].includes(status)
        ? r.status === status
        : true;
      const sourceOk = source === 'site' || source === 'booking' ? r.source === source : true;
      return statusOk && sourceOk;
    });

    const total = filtered.length;
    const reviews = filtered.slice((page - 1) * limit, (page - 1) * limit + limit);

    return NextResponse.json({
      reviews,
      counts,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    logger.error('List customer reviews error', error);
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}
