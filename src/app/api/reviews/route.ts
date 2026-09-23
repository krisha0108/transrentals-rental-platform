import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/db/prisma';
import { fetchBookingReviews, countBookingRatings } from '@/lib/reviews/booking-reviews';
import {
  checkRateLimit,
  RATE_LIMITS,
  logger,
  sanitizeName,
  sanitizeEmail,
  sanitizePhone,
  stripHtml,
} from '@/lib/security';

export const dynamic = 'force-dynamic';

const MAX_COMMENT = 1000;
const MAX_PHOTOS = 4;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Kept in step with the services the site actually sells. An unknown value is
// dropped rather than rejected — the review itself is worth more than the tag.
const SERVICES = [
  'Bike Rental',
  'Car Rental',
  'Self Drive',
  'Luxury Cars',
  'Bus & Tempo',
  'Transporter',
  'Packers & Movers',
  'Equipment Rental',
  'Chauffeur Service',
  'Wander Tours',
  'Other',
];

// A closed list, so the chips on the cards stay a small, readable set instead
// of free text nobody can style or filter on.
const TAGS = [
  'Clean Vehicle',
  'On-Time Delivery',
  'Helpful Vendor',
  'Good Condition',
  'Easy Booking',
  'Fair Price',
  'Great Support',
  'Well Maintained',
];
const MAX_TAGS = 3;

/** Stored as JSON text; a bad value must never take the page down. */
function parseList(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

type FeedReview = {
  id: string;
  name: string;
  city: string | null;
  service: string | null;
  rating: number;
  comment: string;
  isVerified: boolean;
  createdAt: Date;
};

/**
 * GET /api/reviews?limit=5
 *
 * Two things feed this list. `customer_reviews` holds what people write from
 * the homepage form — open to anyone. The booking tables hold the rating a
 * customer left on a trip they actually took. Both go through the same desk:
 * nothing is shown until an admin approves it, which for a booking review is
 * recorded in `booking_review_moderation`. Either way, every rating counts
 * towards the score, approved or not.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));

    // Which booking reviews an admin has cleared.
    const approved = await prisma.booking_review_moderation.findMany({
      where: { status: 'APPROVED' },
      orderBy: [{ reviewedAt: 'desc' }],
      take: limit,
      select: { source: true, bookingId: true },
    });

    const [siteRows, siteCount, siteByRating, bookingRows, bookingByRating] = await Promise.all([
      prisma.customer_reviews.findMany({
        where: { status: 'APPROVED' },
        orderBy: [{ createdAt: 'desc' }],
        take: limit,
        select: {
          id: true,
          name: true,
          city: true,
          service: true,
          rating: true,
          comment: true,
          customerId: true,
          createdAt: true,
        },
      }),
      prisma.customer_reviews.count({ where: { status: 'APPROVED' } }),
      prisma.customer_reviews.groupBy({
        by: ['rating'],
        where: { status: 'APPROVED' },
        _count: { rating: true },
      }),
      fetchBookingReviews({ limit, only: approved }),
      countBookingRatings(),
    ]);

    const siteReviews = siteRows.map((r) => ({
      id: r.id,
      name: r.name,
      city: r.city,
      service: r.service,
      rating: r.rating,
      comment: r.comment,
      // Whether the reviewer was signed in when they wrote it — what the
      // "Verified" badge on the card means.
      isVerified: !!r.customerId,
      createdAt: r.createdAt,
    }));

    // A booking review came off a real booking, so it is verified by definition.
    const bookingReviews: FeedReview[] = bookingRows.map((r) => ({
      id: r.id,
      name: r.name,
      city: r.city,
      service: r.service,
      rating: r.rating,
      comment: r.comment,
      isVerified: true,
      createdAt: r.createdAt,
    }));

    const reviews = [...siteReviews, ...bookingReviews]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    // Every rating from both sources, including the low ones that are not put
    // on the page — a score that only counted the flattering half would not be
    // a score.
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const row of siteByRating) distribution[row.rating] += row._count.rating;
    for (const [rating, count] of Object.entries(bookingByRating)) {
      distribution[Number(rating)] += count;
    }

    const total = Object.values(distribution).reduce((sum, n) => sum + n, 0);
    const weighted = Object.entries(distribution).reduce(
      (sum, [rating, count]) => sum + Number(rating) * count,
      0
    );

    return NextResponse.json({
      reviews,
      total,
      averageRating: total > 0 ? Number((weighted / total).toFixed(1)) : null,
      distribution,
      sources: { site: siteCount, bookings: total - siteCount },
    });
  } catch (error) {
    logger.error('Fetch public reviews error', error);
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}

/** Writes one uploaded image under public/uploads/reviews and returns its path. */
async function savePhoto(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_PHOTO_BYTES) return null;
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) return null;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const filename = `review-${nanoid()}.${ext}`;
    const dir = join(process.cwd(), 'public', 'uploads', 'reviews');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), buffer);
    return `uploads/reviews/${filename}`;
  } catch (error) {
    logger.error('Review photo upload error', error);
    return null;
  }
}

/**
 * POST /api/reviews
 *
 * The homepage "write a review" form. Open to anyone, so every row lands as
 * PENDING; `customerId` is only trusted when it resolves to a real customer.
 *
 * Accepts multipart/form-data (the form, which may carry photos) or JSON.
 */
export async function POST(request: NextRequest) {
  const { limited, resetIn } = checkRateLimit(request, RATE_LIMITS.contact, 'customer-review');
  if (limited) {
    logger.logSecurityEvent('Review form rate limit exceeded', 'low', {
      ip: request.headers.get('x-forwarded-for'),
    });
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.', retryAfter: resetIn },
      { status: 429, headers: { 'Retry-After': String(resetIn) } }
    );
  }

  const isMultipart = (request.headers.get('content-type') || '').includes('multipart/form-data');

  let body: Record<string, unknown> = {};
  let files: File[] = [];

  if (isMultipart) {
    try {
      const fd = await request.formData();
      for (const [key, value] of fd.entries()) {
        if (value instanceof File) {
          if (key.startsWith('photo')) files.push(value);
        } else {
          body[key] = value;
        }
      }
    } catch {
      return NextResponse.json({ error: 'Invalid form submission' }, { status: 400 });
    }
  } else {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
  }

  const name = sanitizeName(String(body.name ?? ''));
  const email = sanitizeEmail(String(body.email ?? ''));
  const phone = sanitizePhone(String(body.phone ?? ''));
  const comment = stripHtml(String(body.comment ?? '')).trim();
  const rating = Number(body.rating);

  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Please enter your name' }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 });
  }
  if (!phone || phone.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Please pick a rating from 1 to 5' }, { status: 400 });
  }
  if (comment.length > MAX_COMMENT) {
    return NextResponse.json({ error: 'Your review is too long' }, { status: 400 });
  }

  const city = body.city ? stripHtml(String(body.city)).trim().slice(0, 120) : null;
  const rawService = body.service ? String(body.service) : '';
  const service = SERVICES.includes(rawService) ? rawService : null;

  // Only tags from the closed list survive, capped, de-duplicated.
  const tags = Array.from(
    new Set(
      (Array.isArray(body.tags) ? (body.tags as unknown[]) : parseList(body.tags))
        .map((t) => String(t))
        .filter((t) => TAGS.includes(t))
    )
  ).slice(0, MAX_TAGS);

  try {
    // A logged-in reviewer is linked to their account, but only after the id
    // is checked against the customers table — the client sends it, so it is
    // not evidence on its own.
    let customerId: string | null = null;
    if (body.customerId) {
      const found = await prisma.customers.findUnique({
        where: { id: String(body.customerId) },
        select: { id: true },
      });
      customerId = found?.id ?? null;
    }

    const photoPaths: string[] = [];
    for (const file of files.slice(0, MAX_PHOTOS)) {
      const path = await savePhoto(file);
      if (path) photoPaths.push(path);
    }

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null;

    const review = await prisma.customer_reviews.create({
      data: {
        customerId,
        name,
        email,
        phone,
        city,
        service,
        rating,
        comment,
        tags: tags.length ? JSON.stringify(tags) : null,
        photos: photoPaths.length ? JSON.stringify(photoPaths) : null,
        ipAddress,
        status: 'PENDING',
      },
      select: { id: true },
    });

    logger.info('Customer review submitted', {
      reviewId: review.id,
      customerId,
      rating,
      tags: tags.length,
      photos: photoPaths.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your review will appear once our team has checked it.',
    });
  } catch (error) {
    logger.error('Submit customer review error', error);
    return NextResponse.json({ error: 'Failed to submit your review' }, { status: 500 });
  }
}
