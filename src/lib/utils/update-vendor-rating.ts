import { prisma } from '@/lib/db/prisma';

/**
 * Recalculate and update vendor rating after a new rating is submitted.
 *
 * Uses totalRatings (count) + current rating (average) to compute a rolling
 * average without querying all booking tables — O(1) DB update.
 *
 * Formula: newAvg = ((oldAvg * count) + newRating) / (count + 1)
 */
export async function updateVendorRating(vendorId: string, newRating: number): Promise<void> {
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
