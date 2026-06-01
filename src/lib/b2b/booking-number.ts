// @ts-nocheck
import { prisma } from '@/lib/db/prisma';

/**
 * Build a B2B booking number: `<PREFIX>-<YEAR>-<5 digits>`.
 * Matches the historical format (`B2B-2026-01234`, `TA-CO-2026-01234`).
 */
export function makeB2BBookingNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return `${prefix}-${year}-${rand}`;
}

/**
 * Create a `b2b_bookings` row with a collision-safe booking number.
 *
 * `data` must NOT contain `bookingNumber` — it is generated here and retried
 * on a unique-constraint violation (Prisma P2002), so a random clash no longer
 * fails the whole booking. Pass `travelAgentId` / `bookingMode` directly in
 * `data` (real columns now), removing the old create-then-raw-UPDATE two step.
 */
export async function createB2BBookingSafe(
  prefix: string,
  data: Record<string, any>,
  maxAttempts = 6,
) {
  let lastErr: any;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await prisma.b2b_bookings.create({
        data: { ...data, bookingNumber: makeB2BBookingNumber(prefix) },
      });
    } catch (e: any) {
      // Only retry on a booking-number collision; rethrow anything else.
      if (e?.code === 'P2002') {
        lastErr = e;
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}
