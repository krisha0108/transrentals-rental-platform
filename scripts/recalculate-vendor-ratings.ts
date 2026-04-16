/**
 * One-time script: Recalculate all vendor ratings from existing booking data.
 *
 * Run: npx tsx scripts/recalculate-vendor-ratings.ts
 *
 * Collects all rated bookings across 7 services, groups by vendorId,
 * computes average, then bulk-updates vendors table.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting vendor rating recalculation...\n');

  // Map: vendorId → array of ratings
  const ratingMap = new Map<string, number[]>();

  const add = (vendorId: string | null | undefined, rating: number | null | undefined) => {
    if (!vendorId || !rating || rating < 1 || rating > 5) return;
    if (!ratingMap.has(vendorId)) ratingMap.set(vendorId, []);
    ratingMap.get(vendorId)!.push(rating);
  };

  // 1. car_bookings (self-drive uses same table) — acceptedVendorId
  const carBookings = await prisma.car_bookings.findMany({
    where: { rating: { not: null }, acceptedVendorId: { not: null } },
    select: { acceptedVendorId: true, rating: true },
  });
  carBookings.forEach(b => add(b.acceptedVendorId, b.rating));
  console.log(`car_bookings:       ${carBookings.length} rated`);

  // 2. chauffeur_bookings — acceptedVendorId
  const chauffeurBookings = await prisma.chauffeur_bookings.findMany({
    where: { rating: { not: null }, acceptedVendorId: { not: null } },
    select: { acceptedVendorId: true, rating: true },
  });
  chauffeurBookings.forEach(b => add(b.acceptedVendorId, b.rating));
  console.log(`chauffeur_bookings: ${chauffeurBookings.length} rated`);

  // 3. luxury_bookings — acceptedVendorId
  const luxuryBookings = await prisma.luxury_bookings.findMany({
    where: { rating: { not: null }, acceptedVendorId: { not: null } },
    select: { acceptedVendorId: true, rating: true },
  });
  luxuryBookings.forEach(b => add(b.acceptedVendorId, b.rating));
  console.log(`luxury_bookings:    ${luxuryBookings.length} rated`);

  // 4. bus_bookings — vendorId
  const busBookings = await prisma.bus_bookings.findMany({
    where: { rating: { not: null } },
    select: { vendorId: true, rating: true },
  });
  busBookings.forEach(b => add(b.vendorId, b.rating));
  console.log(`bus_bookings:       ${busBookings.length} rated`);

  // 5. truck_bookings — vendorId
  const truckBookings = await prisma.truck_bookings.findMany({
    where: { rating: { not: null } },
    select: { vendorId: true, rating: true },
  });
  truckBookings.forEach(b => add(b.vendorId, b.rating));
  console.log(`truck_bookings:     ${truckBookings.length} rated`);

  // 6. packers_bookings — vendorId
  const packersBookings = await prisma.packers_bookings.findMany({
    where: { rating: { not: null } },
    select: { vendorId: true, rating: true },
  });
  packersBookings.forEach(b => add(b.vendorId, b.rating));
  console.log(`packers_bookings:   ${packersBookings.length} rated`);

  // 7. equipment_bookings — vendorId
  const equipmentBookings = await prisma.equipment_bookings.findMany({
    where: { rating: { not: null } },
    select: { vendorId: true, rating: true },
  });
  equipmentBookings.forEach(b => add(b.vendorId, b.rating));
  console.log(`equipment_bookings: ${equipmentBookings.length} rated`);

  console.log(`\nVendors with ratings: ${ratingMap.size}`);

  if (ratingMap.size === 0) {
    console.log('No ratings found — nothing to update.');
    return;
  }

  // Bulk update
  let updated = 0;
  let skipped = 0;

  for (const [vendorId, ratings] of ratingMap.entries()) {
    const total    = ratings.length;
    const avg      = ratings.reduce((s, r) => s + r, 0) / total;
    const rounded  = Math.round(avg * 100) / 100;

    try {
      await prisma.vendors.update({
        where: { id: vendorId },
        data: { rating: rounded, totalRatings: total },
      });
      console.log(`  ✓ Vendor ${vendorId} → ${rounded} (${total} ratings)`);
      updated++;
    } catch (err: any) {
      // Vendor might not exist (deleted) — skip
      console.log(`  ✗ Vendor ${vendorId} not found — skipped`);
      skipped++;
    }
  }

  // Reset vendors with no ratings to 0
  const ratedVendorIds = Array.from(ratingMap.keys());
  const reset = await prisma.vendors.updateMany({
    where: { id: { notIn: ratedVendorIds }, totalRatings: { gt: 0 } },
    data: { rating: 0, totalRatings: 0 },
  });

  console.log(`\n✅ Done.`);
  console.log(`   Updated:  ${updated} vendors`);
  console.log(`   Skipped:  ${skipped} vendors (not found)`);
  console.log(`   Reset:    ${reset.count} vendors (had stale ratings, now 0)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
