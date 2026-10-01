import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/security';

/**
 * Reviews customers leave on a booking they actually took.
 *
 * Each service keeps its own booking table with its own `rating` / `review`
 * columns, so they are read together with one UNION rather than eight round
 * trips. Whether one is shown on the site is not stored here — that decision
 * lives in `booking_review_moderation`, keyed by (source, bookingId).
 */
export type BookingSource = {
  /** The table the review sits in — also the first half of its id. */
  table: string;
  /** What the customer booked, as the site names it. */
  service: string;
  /** Column holding the city, or 'NULL' for tables that do not have one. */
  cityColumn: string;
  /** Short key the vendor and admin views use for this service. */
  key: string;
  /** The service as a vendor knows it — `service` above is the public wording. */
  label: string;
  /** Column holding the vendor who ran the booking. */
  vendorColumn: string;
  /** Column holding when the trip started. */
  tripDateColumn: string;
  /** Best record of when the trip finished, which is when it could be rated. */
  reviewedAtExpr: string;
  /** Optional per-aspect ratings: [column, label]. At most two per table. */
  subRatings: [string, string][];
};

export const BOOKING_SOURCES: BookingSource[] = [
  {
    table: 'bike_bookings', service: 'Bike Rental', cityColumn: 'locationName',
    key: 'bike', label: 'Bike Rental', vendorColumn: 'acceptedVendorId',
    tripDateColumn: 'pickupDate', reviewedAtExpr: 'COALESCE(returnedAt, updatedAt)',
    subRatings: [['driverRating', 'Driver'], ['vehicleRating', 'Vehicle']],
  },
  {
    table: 'bus_bookings', service: 'Bus & Tempo', cityColumn: 'NULL',
    key: 'bus', label: 'Bus & Tempo', vendorColumn: 'vendorId',
    tripDateColumn: 'pickupDate', reviewedAtExpr: 'COALESCE(completedAt, updatedAt)',
    subRatings: [['driverRating', 'Driver'], ['vehicleRating', 'Vehicle']],
  },
  {
    // car_bookings is the self-drive table, despite its name.
    table: 'car_bookings', service: 'Car Rental', cityColumn: 'locationName',
    key: 'self-drive', label: 'Self Drive', vendorColumn: 'acceptedVendorId',
    tripDateColumn: 'pickupDate', reviewedAtExpr: 'COALESCE(completedAt, updatedAt)',
    subRatings: [],
  },
  {
    table: 'chauffeur_bookings', service: 'Chauffeur Service', cityColumn: 'locationName',
    key: 'car', label: 'Car Rental', vendorColumn: 'acceptedVendorId',
    tripDateColumn: 'pickupDate', reviewedAtExpr: 'COALESCE(completedAt, updatedAt)',
    subRatings: [['driverRating', 'Driver']],
  },
  {
    table: 'equipment_bookings', service: 'Equipment Rental', cityColumn: 'NULL',
    key: 'equipment', label: 'Equipment Rental', vendorColumn: 'vendorId',
    tripDateColumn: 'startDate', reviewedAtExpr: 'COALESCE(completedAt, updatedAt)',
    subRatings: [['equipmentRating', 'Equipment']],
  },
  {
    table: 'luxury_bookings', service: 'Luxury Cars', cityColumn: 'locationName',
    key: 'luxury', label: 'Luxury Cars', vendorColumn: 'acceptedVendorId',
    tripDateColumn: 'pickupDate', reviewedAtExpr: 'COALESCE(completedAt, updatedAt)',
    subRatings: [['driverRating', 'Driver'], ['vehicleRating', 'Vehicle']],
  },
  {
    table: 'packers_bookings', service: 'Packers & Movers', cityColumn: 'NULL',
    key: 'packers', label: 'Packers & Movers', vendorColumn: 'vendorId',
    tripDateColumn: 'scheduledDate', reviewedAtExpr: 'COALESCE(completedAt, updatedAt)',
    subRatings: [['teamRating', 'Team'], ['packingRating', 'Packing']],
  },
  {
    table: 'truck_bookings', service: 'Transporter', cityColumn: 'NULL',
    key: 'truck', label: 'Transporter', vendorColumn: 'vendorId',
    tripDateColumn: 'pickupDate', reviewedAtExpr: 'COALESCE(completedAt, updatedAt)',
    subRatings: [['driverRating', 'Driver']],
  },
];

/** Wander keeps reviews in a table of its own; it joins the vendor view under this key. */
export const WANDER_SOURCE = { key: 'wander', label: 'Wander Tour', table: 'wander_reviews' };

/** Every key a vendor or admin can filter reviews by. */
export const REVIEW_SERVICE_KEYS = [...BOOKING_SOURCES.map((s) => s.key), WANDER_SOURCE.key];

export type BookingReview = {
  /** `${table}:${bookingId}` — unique across every service. */
  id: string;
  source: string;
  bookingId: string;
  bookingNumber: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  service: string;
  rating: number;
  comment: string;
  createdAt: Date;
  /** Who ran the booking, if it was ever accepted. */
  vendorId: string | null;
};

/** Escapes a value for a SQL string literal built here, not by a caller. */
function quote(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * The newest booking reviews. With `only`, just those ids; the list is built
 * from values this module owns, never from anything a visitor sent.
 */
export async function fetchBookingReviews(options: {
  limit: number;
  only?: { source: string; bookingId: string }[];
  /** Just the reviews of bookings this vendor ran. */
  vendorId?: string;
}): Promise<BookingReview[]> {
  const { limit, only, vendorId } = options;
  if (only && only.length === 0) return [];

  const wanted = only
    ? new Map(
        BOOKING_SOURCES.map((s) => [
          s.table,
          only.filter((o) => o.source === s.table).map((o) => o.bookingId),
        ])
      )
    : null;

  const parts = BOOKING_SOURCES.filter((s) => !wanted || (wanted.get(s.table) || []).length > 0).map(
    ({ table, service, cityColumn, vendorColumn }) => {
      const idFilter = wanted
        ? ` AND id IN (${(wanted.get(table) || []).map(quote).join(', ')})`
        : '';
      const vendorFilter = vendorId ? ` AND ${vendorColumn} = ${quote(vendorId)}` : '';
      return `
        SELECT
          ${quote(table)}        AS source,
          id                     AS bookingId,
          bookingNumber          AS bookingNumber,
          customerName           AS name,
          customerEmail          AS email,
          customerPhone          AS phone,
          ${cityColumn}          AS city,
          ${quote(service)}      AS service,
          rating                 AS rating,
          COALESCE(review, '')   AS comment,
          updatedAt              AS createdAt,
          ${vendorColumn}        AS vendorId
        FROM \`${table}\`
        WHERE rating IS NOT NULL${idFilter}${vendorFilter}`;
    }
  );

  if (!parts.length) return [];

  try {
    const rows = await prisma.$queryRawUnsafe<
      {
        source: string;
        bookingId: string;
        bookingNumber: string;
        name: string;
        email: string | null;
        phone: string | null;
        city: string | null;
        service: string;
        rating: number;
        comment: string;
        createdAt: Date;
        vendorId: string | null;
      }[]
    >(`${parts.join(' UNION ALL ')} ORDER BY createdAt DESC LIMIT ${Math.max(1, limit)}`);

    return rows.map((r) => ({
      id: `${r.source}:${r.bookingId}`,
      source: r.source,
      bookingId: r.bookingId,
      bookingNumber: r.bookingNumber,
      name: r.name,
      email: r.email,
      phone: r.phone,
      city: r.city,
      service: r.service,
      rating: Number(r.rating),
      comment: r.comment,
      createdAt: new Date(r.createdAt),
      vendorId: r.vendorId,
    }));
  } catch (error) {
    // A table missing in some environment must not take the page down.
    logger.error('Fetch booking reviews error', error);
    return [];
  }
}

/** How many ratings of each value exist across the booking tables. */
export async function countBookingRatings(): Promise<Record<number, number>> {
  const union = BOOKING_SOURCES.map(
    ({ table }) => `SELECT rating FROM \`${table}\` WHERE rating IS NOT NULL`
  ).join(' UNION ALL ');

  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  try {
    const rows = await prisma.$queryRawUnsafe<{ rating: number; c: bigint }[]>(
      `SELECT rating, COUNT(*) AS c FROM (${union}) AS all_ratings GROUP BY rating`
    );
    for (const row of rows) {
      const rating = Number(row.rating);
      if (rating >= 1 && rating <= 5) counts[rating] = Number(row.c);
    }
  } catch (error) {
    logger.error('Count booking ratings error', error);
  }
  return counts;
}

/** Splits `bike_bookings:abc123` back into its parts, if it is one of ours. */
export function parseBookingReviewId(id: string): { source: string; bookingId: string } | null {
  const at = id.indexOf(':');
  if (at === -1) return null;
  const source = id.slice(0, at);
  const bookingId = id.slice(at + 1);
  if (!bookingId || !BOOKING_SOURCES.some((s) => s.table === source)) return null;
  return { source, bookingId };
}

/** One review of a vendor's work, whichever service it came from. */
export type VendorReview = {
  /** `${table}:${id}` — for a booking review, the same id moderation uses. */
  id: string;
  /** The service key, e.g. 'bike' or 'wander'. */
  source: string;
  serviceLabel: string;
  bookingId: string;
  bookingNumber: string | null;
  rating: number;
  review: string | null;
  subRatings: Record<string, number>;
  /** Full name as booked — callers showing it to a vendor should shorten it. */
  customerName: string | null;
  tripDate: Date | null;
  reviewedAt: Date | null;
  /** booking_review_moderation status (PENDING if never decided), or the wander review's own status. */
  moderationStatus: string;
};

export type VendorReviewSummary = {
  average: number;
  total: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
};

type VendorReviewRow = {
  source: string;
  reviewId: string;
  bookingId: string;
  bookingNumber: string | null;
  rating: number;
  review: string | null;
  customerName: string | null;
  tripDate: Date | null;
  reviewedAt: Date | null;
  sub1: number | null;
  sub2: number | null;
  moderationStatus: string | null;
};

/**
 * Every review of the bookings one vendor ran, across all services plus
 * Wander, newest first. The summary always covers everything; `rating` and
 * `service` only narrow the page of reviews.
 *
 * A vendor sees their own feedback whatever the moderation desk decided, so
 * booking reviews are never dropped here. Wander reviews are the exception
 * only because that table has its own visibility status: by default just the
 * ACTIVE ones are returned.
 */
export async function fetchVendorReviews(
  vendorId: string,
  options: {
    page: number;
    limit: number;
    rating?: number;
    service?: string;
    allWanderStatuses?: boolean;
  }
): Promise<{ summary: VendorReviewSummary; reviews: VendorReview[]; filteredTotal: number }> {
  const { page, limit, rating, service, allWanderStatuses } = options;

  const params: unknown[] = [];
  const parts = BOOKING_SOURCES.map((s) => {
    params.push(vendorId);
    const [sub1, sub2] = s.subRatings;
    return `
      SELECT
        ${quote(s.key)}           AS source,
        t.id                      AS reviewId,
        t.id                      AS bookingId,
        t.bookingNumber           AS bookingNumber,
        t.rating                  AS rating,
        NULLIF(t.review, '')      AS review,
        t.customerName            AS customerName,
        t.${s.tripDateColumn}     AS tripDate,
        ${s.reviewedAtExpr}       AS reviewedAt,
        ${sub1 ? `t.${sub1[0]}` : 'NULL'} AS sub1,
        ${sub2 ? `t.${sub2[0]}` : 'NULL'} AS sub2,
        (SELECT m.status FROM booking_review_moderation m
          WHERE m.source = ${quote(s.table)} AND m.bookingId = t.id) AS moderationStatus
      FROM \`${s.table}\` t
      WHERE t.rating IS NOT NULL AND t.${s.vendorColumn} = ?`;
  });

  params.push(vendorId);
  parts.push(`
      SELECT
        ${quote(WANDER_SOURCE.key)} AS source,
        r.id                      AS reviewId,
        r.bookingId               AS bookingId,
        wb.bookingId              AS bookingNumber,
        r.rating                  AS rating,
        NULLIF(CONCAT_WS(' - ', NULLIF(r.title, ''), NULLIF(r.review, '')), '') AS review,
        c.name                    AS customerName,
        wb.travelDate             AS tripDate,
        r.createdAt               AS reviewedAt,
        NULL                      AS sub1,
        NULL                      AS sub2,
        r.status                  AS moderationStatus
      FROM wander_reviews r
      JOIN wander_listings l ON l.id = r.listingId
      LEFT JOIN wander_bookings wb ON wb.id = r.bookingId
      LEFT JOIN customers c ON c.id = r.customerId
      WHERE l.vendorId = ?${allWanderStatuses ? '' : ` AND r.status = 'ACTIVE'`}`);

  const union = parts.join(' UNION ALL ');

  const filters: string[] = [];
  const filterParams: unknown[] = [];
  if (rating) {
    filters.push('rating = ?');
    filterParams.push(rating);
  }
  if (service) {
    filters.push('source = ?');
    filterParams.push(service);
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const summary: VendorReviewSummary = {
    average: 0,
    total: 0,
    distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
  };

  const [countRows, filteredRows, rows] = await Promise.all([
    prisma.$queryRawUnsafe<{ rating: number; c: bigint }[]>(
      `SELECT rating, COUNT(*) AS c FROM (${union}) AS v GROUP BY rating`,
      ...params
    ),
    prisma.$queryRawUnsafe<{ c: bigint }[]>(
      `SELECT COUNT(*) AS c FROM (${union}) AS v ${where}`,
      ...params,
      ...filterParams
    ),
    prisma.$queryRawUnsafe<VendorReviewRow[]>(
      `SELECT * FROM (${union}) AS v ${where}
       ORDER BY reviewedAt DESC, reviewId DESC LIMIT ? OFFSET ?`,
      ...params,
      ...filterParams,
      limit,
      (page - 1) * limit
    ),
  ]);

  let sum = 0;
  for (const row of countRows) {
    const value = Number(row.rating);
    const count = Number(row.c);
    if (value >= 1 && value <= 5) {
      summary.distribution[String(value) as keyof VendorReviewSummary['distribution']] = count;
      summary.total += count;
      sum += value * count;
    }
  }
  summary.average = summary.total ? Math.round((sum / summary.total) * 10) / 10 : 0;

  const byKey = new Map(BOOKING_SOURCES.map((s) => [s.key, s]));

  const reviews = rows.map((r): VendorReview => {
    const source = byKey.get(r.source);
    const subRatings: Record<string, number> = {};
    const labels = source?.subRatings ?? [];
    [r.sub1, r.sub2].forEach((value, i) => {
      if (value !== null && value !== undefined && labels[i]) subRatings[labels[i][1]] = Number(value);
    });
    return {
      id: `${source ? source.table : WANDER_SOURCE.table}:${r.reviewId}`,
      source: r.source,
      serviceLabel: source ? source.label : WANDER_SOURCE.label,
      bookingId: r.bookingId,
      bookingNumber: r.bookingNumber,
      rating: Number(r.rating),
      review: r.review,
      subRatings,
      customerName: r.customerName,
      tripDate: r.tripDate ? new Date(r.tripDate) : null,
      reviewedAt: r.reviewedAt ? new Date(r.reviewedAt) : null,
      moderationStatus: r.moderationStatus ?? 'PENDING',
    };
  });

  return { summary, reviews, filteredTotal: Number(filteredRows[0]?.c ?? 0) };
}

/** "Rahul Sharma" -> "Rahul S." — enough for a vendor to recognise, no more. */
export function shortCustomerName(name: string | null): string | null {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}
