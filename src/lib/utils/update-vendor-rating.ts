import { prisma } from '@/lib/db/prisma';

/**
 * Recalculate and update vendor rating after a new rating is submitted.
 *
 * Uses totalRatings (count) + current rating (average) to compute a rolling
 * average without querying all booking tables — O(1) DB update.
 *
 * Formula: newAvg = ((oldAvg * count) + newRating) / (count + 1)
 */
export async function updateVendorRating(vendorId: string | null | undefined, newRating: number): Promise<void> {
  if (!vendorId || !newRating || newRating < 1 || newRating > 5) return;

  try {
    const vendor = await prisma.vendors.findUnique({
      where: { id: vendorId },
      select: { rating: true, totalRatings: true },
    });

    if (!vendor) return;

    const count     = vendor.totalRatings || 0;
    const oldAvg    = vendor.rating || 0;
    const newAvg    = ((oldAvg * count) + newRating) / (count + 1);

    await prisma.vendors.update({
      where: { id: vendorId },
      data: {
        rating:       Math.round(newAvg * 100) / 100, // round to 2 decimal places
        totalRatings: count + 1,
      },
    });
  } catch (err) {
    // Non-critical — log but don't throw
    console.error('[updateVendorRating] Failed to update vendor rating:', err);
  }
}

/** A whole star rating 1-5 from a request body (number or numeric string), else null. */
export function parseStarRating(value: unknown): number | null {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}
