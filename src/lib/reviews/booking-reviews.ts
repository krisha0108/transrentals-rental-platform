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
};

export const BOOKING_SOURCES: BookingSource[] = [
  { table: 'bike_bookings', service: 'Bike Rental', cityColumn: 'locationName' },
  { table: 'bus_bookings', service: 'Bus & Tempo', cityColumn: 'NULL' },
  { table: 'car_bookings', service: 'Car Rental', cityColumn: 'locationName' },
  { table: 'chauffeur_bookings', service: 'Chauffeur Service', cityColumn: 'locationName' },
  { table: 'equipment_bookings', service: 'Equipment Rental', cityColumn: 'NULL' },
  { table: 'luxury_bookings', service: 'Luxury Cars', cityColumn: 'locationName' },
  { table: 'packers_bookings', service: 'Packers & Movers', cityColumn: 'NULL' },
  { table: 'truck_bookings', service: 'Transporter', cityColumn: 'NULL' },
];

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
}): Promise<BookingReview[]> {
  const { limit, only } = options;
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
    ({ table, service, cityColumn }) => {
      const idFilter = wanted
        ? ` AND id IN (${(wanted.get(table) || []).map(quote).join(', ')})`
        : '';
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
          updatedAt              AS createdAt
        FROM \`${table}\`
        WHERE rating IS NOT NULL${idFilter}`;
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
